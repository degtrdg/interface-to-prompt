"use server";

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { FlashCardType } from "@/lib/types/flashcard";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const FlashCardSchema = z.object({
  cards: z.array(
    z.object({
      front: z.string().describe("The question text"),
      back: z.string().describe("The answer text"),
    })
  ),
});

const getContentFormatterPrompt = (content: string) =>
  `output this verbatim with nothing left out but formatted in a way makes it easier to read. if you see artifacts of bad copy-pasting (like stuff that could plausibly be from a button, random text that doesn't make sense in the sentence that was interleaved from something which removed make it easier to read (random Edit or DG or something like that which should be removed) etc.), remove them, otherwise keep everything the same. only output in a \`\`\`txt codeblock, no commentary since ill use grep to extract the content. add --- delineations between sections. we'll be splitting on these as chapters for an incremental reading software. each section will be used as an all encomppassing unit of information to extract questions for. we want to minimize the number of sections. keep things together where you can instead of splitting them up if they are related, like question answer pairs. if it's a chat, keep the user query and assistant response together in one section.

remove and add newlines where you see fit but try to keep it tight (like within lists) without excessive spacing so that it's information dense. do not change or add any words otherwise. no adding titles or anything. no adding things to clarify who said what. add minial markdown formatting. if you think that something has been flattened in terms of a list, indentation, quotes (>), or spacing, add it if you think it's useful in being able to read it.

content to format
\`\`\`
${content}
\`\`\``;

const getQuestionGeneratorPrompt = (
  slide: string,
  selection: string,
  exampleQuestions: string,
  deletedQuestions?: string
) =>
  `
the following is a past conversation i had to understand a concept. i need to consolidate every piece of understanding i had here in spaced repetition cards. I'm going to incrementally add questions I've made myself here to keep track of where I'm at and to give you an idea of what questions I'm trying to extract. we need to do this till we get to the end of the conversation. you should know the principles of piotr wozniak of making proper spaced repetition questions that are useful as opposed to questions for the sake of questions. the questions need to me atomic and low mental overhead (very easy to answer). but not so easy that they're leading or reduced to a yes or no answer.they should build on each other instead of making a big one. there should be one clear answer that anyone who understood it would be able to give without having seen the answer before.

<full_conversation>
${slide}
</full_conversation>

this is the specific selection of the text im reading right now that i want you to make a question out of.

<selection>
${selection}
</selection>

these are some questions we've made together so far. some of them have edited versions that show a not ideal original question and what i edited it into to make it into a good question.
<questions>
${exampleQuestions}
</questions>

${
  deletedQuestions
    ? `
these are questions that were previously deleted, which can help you understand what kinds of questions weren't useful:
<deleted_questions>
${deletedQuestions}
</deleted_questions>
`
    : ""
}

please make an exhaustive list of spaced repetition questions that i would extract from the selection.
`;

const getExtractionPrompt = (msg: string) =>
  `
extract out the questions from this conversation output. don't include extraneous information or questions that aren't part of the question answer format.

<full_conversation>
${msg}
</full_conversation>
`;

export async function formatContent(content: string): Promise<string> {
  console.log("Formatting content:", content.slice(0, 100) + "...");

  const completion = await openai.chat.completions.create({
    model: "o1-mini",
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
    "Generating questions for selection:",
    selection.slice(0, 100) + "..."
  );

  // Step 1: Generate questions using Claude
  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system:
      "You are an expert at making spaced repetition questions from a conversation.",
    messages: [
      {
        role: "user",
        content: getQuestionGeneratorPrompt(
          content,
          selection,
          JSON.stringify(exampleQuestions, null, 2),
          deletedCards ? JSON.stringify(deletedCards, null, 2) : undefined
        ),
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
    return cards;
  } catch (error) {
    console.error("Error parsing response:", error);
    return [];
  }
}
