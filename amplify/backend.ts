import { pdfGenerator } from './pdf-generator/resource';

export default function defineBackend() {
  return {
    // Add backend functions here
    pdfGenerator,
  };
}
