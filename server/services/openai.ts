import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
export async function analyzeBookshelfImage(base64Image: string): Promise<{
  books: Array<{ title: string; author?: string }>;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a book identification expert. Analyze the image and list all visible book titles and authors. Respond in JSON format with an array of books containing title and author fields."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please identify all visible books in this image."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    return JSON.parse(content) as { books: Array<{ title: string; author?: string }> };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to analyze image: ${errorMessage}`);
  }
}