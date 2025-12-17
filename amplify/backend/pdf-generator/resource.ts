import { defineFunction } from "@aws-amplify/backend";

export const pdfGenerator = defineFunction({
  name: "pdf-generator",
  entry: "./handler.ts"
});
