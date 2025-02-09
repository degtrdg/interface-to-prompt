export interface QuestionGenerationPromptParams {
  fullConversation: string;
  selection: string;
  exampleQuestions: string;
  deletedQuestions?: string;
}

export const getQuestionGeneratorPrompt = ({
  fullConversation,
  selection,
  exampleQuestions,
  deletedQuestions,
}: QuestionGenerationPromptParams): string => {
  const prompt = `
the following is a past conversation i had to understand a concept. i need to consolidate every piece of understanding i had here in spaced repetition cards. I'm going to incrementally add questions I've made myself here to keep track of where I'm at and to give you an idea of what questions I'm trying to extract. we need to do this till we get to the end of the conversation. you should know the principles of piotr wozniak of making proper spaced repetition questions that are useful as opposed to questions for the sake of questions. the questions need to me atomic and low mental overhead (very easy to answer). but not so easy that they're leading or reduced to a yes or no answer.they should build on each other instead of making a big one. there should be one clear answer that anyone who understood it would be able to give without having seen the answer before.

<full_conversation>
${fullConversation}
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

please make an exhaustive list of spaced repetition questions that i would extract from the selection.`;

  return prompt;
};

export const getQuestionGeneratorPrompt2 = ({
  fullConversation,
  selection,
  exampleQuestions,
  deletedQuestions,
}: QuestionGenerationPromptParams): string => {
  const prompt = `
  the following is a past conversation i had to understand a concept. i need to consolidate every piece of understanding i had here in spaced repetition cards. I'm going to incrementally add questions I've made myself here to keep track of where I'm at and to give you an idea of what questions I'm trying to extract. we need to do this till we get to the end of the conversation. you should know the principles of piotr wozniak of making proper spaced repetition questions that are useful as opposed to questions for the sake of questions. the questions need to me atomic and low mental overhead (very easy to answer). but not so easy that they're leading or reduced to a yes or no answer.they should build on each other instead of making a big one. there should be one clear answer that anyone who understood it would be able to give without having seen the answer before.
  
  <full_conversation>
  ${fullConversation}
  </full_conversation>
  
  this is the specific selection of the text im reading right now that i want you to make a question out of.
  
  <selection>
  ${selection}
  </selection>
  
  please make an exhaustive list of spaced repetition questions that i would extract from the selection.`;

  return prompt;
};

export const PROMPT_DESCRIPTION = {
  intro:
    "The following is a past conversation I had to understand a concept. I need to consolidate every piece of understanding I had here in spaced repetition cards. I'm going to incrementally add questions I've made myself here to keep track of where I'm at and to give you an idea of what questions I'm trying to extract.",
  principles:
    "We need to do this till we get to the end of the conversation. You should know the principles of Piotr Wozniak of making proper spaced repetition questions that are useful as opposed to questions for the sake of questions.",
  requirements:
    "The questions need to be atomic and low mental overhead (very easy to answer) but not so easy that they're leading or reduced to a yes/no answer. They should build on each other instead of making a big one. There should be one clear answer that anyone who understood it would be able to give without having seen the answer before.",
  instruction:
    "Please make an exhaustive list of spaced repetition questions that I would extract from the selection.",
};
