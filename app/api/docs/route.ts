/**
 * @module api/docs
 * @description Serves an interactive Swagger UI page for the CineList API.
 * The OpenAPI specification is embedded directly in the HTML from docs/openapi.yaml.
 */

import { readFileSync } from "fs"
import { join } from "path"
import { NextResponse } from "next/server"

/**
 * Serves the Swagger UI HTML page with the embedded OpenAPI spec.
 * @returns HTML response with Swagger UI rendering the CineList API documentation
 */
export async function GET() {
  const specPath = join(process.cwd(), "docs", "openapi.yaml")
  let specYaml: string
  try {
    specYaml = readFileSync(specPath, "utf-8")
  } catch {
    return NextResponse.json(
      { error: "OpenAPI spec not found" },
      { status: 404 }
    )
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CineList API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/js-yaml@4/dist/js-yaml.min.js"></script>
  <script>
    const specYaml = ${JSON.stringify(specYaml)};
    const spec = jsyaml.load(specYaml);
    SwaggerUIBundle({
      spec: spec,
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      layout: "BaseLayout"
    });
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  })
}
