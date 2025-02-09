"use server";

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { FlashCardType } from "@/lib/types/flashcard";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { getQuestionGeneratorPrompt } from "@/lib/prompts/question-generation";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const getContentFormatterPrompt = (content: string) =>
  `output the following content verbatim with nothing left out but formatted in a way that makes it easier to read. if you see artifacts of bad copy-pasting, remove them (ex. "DGim trying Edit to" -> "im trying to"). only output in a \`\`\`txt codeblock, no commentary since ill use grep to extract the content. add --- delineations between sections. we'll be splitting on these as sections for an incremental reading software. each section will be used as an all-encompassing unit of information to extract questions. so if you're reading a section, you want to be able to understand it as a whole (so you don't want a reply to a question separated from the question). we also want to minimize the number of sections.

remove and add newlines where you see fit but try to keep it tight (like within lists) without excessive spacing so that it's information dense. do not change or add any sentences otherwise. no adding titles or anything. no adding things to clarify who said what. add minial markdown formatting. if you think that something has been flattened in terms of a list, indentation, quotes (>), or spacing, add it if you think it's useful in being able to read it.

content to format
\`\`\`
${content}
\`\`\``;

const getExtractionPrompt = (msg: string) =>
  `
extract out the questions from this conversation output. don't include extraneous information or questions that aren't part of the question answer format.

<full_conversation>
${msg}
</full_conversation>
`;

function processQuestionsForPrompt(questions: FlashCardType[]): Array<{
  front: string;
  back: string;
  original?: { front: string; back: string };
}> {
  return questions.map(({ front, back, original }) => {
    // Only include original if it's different from current front/back
    const hasChanged =
      original && (original.front !== front || original.back !== back);
    return {
      front,
      back,
      ...(hasChanged ? { original } : {}),
    };
  });
}

export async function formatContent(content: string): Promise<string> {
  console.log("Formatting content:", content.slice(0, 100) + "...");

  const completion = await openai.chat.completions.create({
    model: "o3-mini",
    messages: [
      {
        role: "user",
        content: getContentFormatterPrompt(content),
      },
    ],
  });

  console.log("Got OpenAI completion response");
  const response = completion.choices[0].message.content;
  console.log("Response content:", response?.slice(0, 100) + "...");

  const matches = response?.match(/```txt\n([\s\S]*?)```/g);
  console.log("Found matches:", matches?.length ?? 0);

  if (matches) {
    const extractedContent = matches.map((match) =>
      match.replace(/```txt\n/, "").replace(/```$/, "")
    );
    console.log("Extracted and formatted content");
    return extractedContent.join("\n");
  }

  console.log("No matches found, returning original content");
  return content; // Return original if no matches found
}

export async function generateQuestions(
  content: string,
  selection: string,
  exampleQuestions: FlashCardType[],
  deletedCards?: FlashCardType[]
): Promise<FlashCardType[]> {
  console.log(
    "Generating questions for selection back:",
    selection.slice(0, 100) + "..."
  );

  // Process questions before sending to LLM
  const processedExampleQuestions = processQuestionsForPrompt(exampleQuestions);
  const processedDeletedCards = deletedCards
    ? processQuestionsForPrompt(deletedCards)
    : undefined;

  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system:
      "You are an expert at making spaced repetition questions from a conversation.",
    messages: [
      {
        role: "user",
        content: getQuestionGeneratorPrompt({
          fullConversation: content,
          selection,
          exampleQuestions: JSON.stringify(processedExampleQuestions, null, 2),
          // deletedQuestions: processedDeletedCards
          // ? JSON.stringify(processedDeletedCards, null, 2)
          // : undefined,
          deletedQuestions: undefined,
        }),
      },
    ],
  });

  const claudeResponse = msg.content.find((block) => block.type === "text");
  if (!claudeResponse || !("text" in claudeResponse)) {
    console.log("No text response from Anthropic");
    return [];
  }
  const FlashCardSchema = z.object({
    cards: z.array(
      z.object({
        front: z.string().describe("The question text"),
        back: z.string().describe("The answer text"),
      })
    ),
  });

  // Step 2: Extract and format questions using OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an expert at extracting questions from a conversation.",
      },
      {
        role: "user",
        content: getExtractionPrompt(claudeResponse.text),
      },
    ],
    response_format: zodResponseFormat(FlashCardSchema, "flashcards"),
  });

  const responseContent = response.choices[0].message.content;
  if (!responseContent) {
    console.log("No response from OpenAI");
    return [];
  }

  try {
    const parsedContent = JSON.parse(responseContent);
    const validatedContent = FlashCardSchema.parse(parsedContent);

    const cards = validatedContent.cards.map((card) => ({
      front: card.front,
      back: card.back,
      original: {
        front: card.front,
        back: card.back,
      },
    }));

    console.log(`Generated ${cards.length} questions`);
    return cards as FlashCardType[];
  } catch (error) {
    console.error("Error parsing response:", error);
    return [];
  }
}
