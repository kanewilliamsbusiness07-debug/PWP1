declare module '*/pdf-generator/resource' {
  const pdfGenerator: any;
  export { pdfGenerator };
  export default pdfGenerator;
}

declare module './amplify/backend' {
  const m: any;
  export default m;
}
