# TruthLens AI — Practical Project Write-up

## Project topic

**TruthLens AI: Deepfake Media Analysis and News Claim Verification Platform**

## Software used

- macOS, Node.js, and npm for development
- Next.js and React for the web application
- TypeScript for application and backend code
- Tailwind CSS for the user interface
- SQLite for local development data
- Cloudflare Workers for the deployed cloud API, with D1 for records, R2 for uploaded files, and Queues for background analysis
- Google Gemini as the primary AI provider and OpenRouter as a fallback provider
- A web browser and terminal for running and reviewing the application

The backend is deployed at **https://truthlens-api.truthlens-ai.workers.dev**. The Next.js user interface is run separately.

## Hardware used

- A Mac computer used for development. **Fill in the exact Mac model, processor, and RAM from About This Mac.**
- Internet connection for package installation and optional cloud AI analysis
- A modern web browser to use the application

## Technologies

- **Frontend:** HTML, CSS, React, Next.js, TypeScript, and Tailwind CSS
- **Backend:** Next.js API routes for the local app and a Cloudflare Worker API for cloud hosting
- **Database and storage:** SQLite for local development; Cloudflare D1 for cloud records and private R2 storage for uploaded media and reports
- **Background processing:** Cloudflare Queues for asynchronous analysis jobs
- **AI integration:** Gemini API as the primary provider, with OpenRouter as the secondary provider
- **Security basics:** Server-side API key storage, authenticated backend requests, file-size limits, file signature checks, and explicit consent before external AI processing

## Description

TruthLens AI is a web application that helps a user inspect suspicious digital media and evaluate a submitted news claim. A user can submit an image, video, audio file, public URL, or text claim. The backend validates the input, calculates a file hash for uploaded media, stores the file privately, and creates an analysis job. A background worker performs basic file-format and metadata-marker checks. With user consent, the backend tries Gemini first and can fall back to OpenRouter. The application displays the findings, limitations, and a downloadable report.

The system is designed to communicate uncertainty. A missing metadata marker does not prove that media is fake, and an AI response is not forensic proof. In the current cloud MVP, submitted source URLs are recorded but not fetched, so a claim cannot be described as independently verified unless source-retrieval functionality is added.

## Methodology — Module 1: Requirement analysis and system design

1. Identify the problem: manipulated media and misleading claims can be difficult for a user to assess quickly.
2. Define the users and inputs: users submit media, a public URL, or a written claim and receive an understandable analysis report.
3. Define functional requirements: input validation, consent handling, file storage, background processing, provider selection, analysis history, deletion, and report download.
4. Define quality requirements: clear uncertainty, privacy-conscious handling of uploaded files, safe handling of credentials, responsive UI, and useful error messages.
5. Design the architecture: a Next.js and React interface communicates with an API; the cloud backend uses a Worker, D1, private R2 storage, and a Queue. Gemini is primary and OpenRouter is secondary.
6. Plan the analysis flow: validate input, inspect basic file signatures and metadata markers, optionally call an AI provider with consent, record the result, and show the limitations in the report.

## Methodology — Module 2: Implementation and testing

1. Build the web interface for submitting an input, viewing progress, reviewing analysis history, changing display settings, and opening a report.
2. Implement API routes for creating, listing, viewing, and deleting analyses and for generating reports.
3. Implement the cloud backend using D1 for structured records, private R2 objects for media and reports, and a Queue for analysis jobs.
4. Store provider credentials as server-side secrets. The browser does not receive Gemini or OpenRouter keys.
5. Implement input checks, file-size limits, supported-file signature checks, consent handling, and safe error responses.
6. Test the application with automated tests and backend smoke checks. The checks below were completed against the deployed Worker.

### Test results

- Automated application tests: **15 passed**.
- Cloud Worker TypeScript check, local D1 migration, and Worker bundle dry-run: **passed**.
- Deployed backend smoke checks: **passed** for liveness/readiness, authenticated analysis creation, queue processing, result retrieval, report generation/download, media upload/storage, and deletion.
- Gemini and OpenRouter credential/model health checks: **passed**. These checks do not send an inference request.
- One consent-based synthetic inference completed through **OpenRouter**. A direct Gemini text-generation check returned HTTP 403 `PERMISSION_DENIED`; the supplied Google project/key needs its generation access checked before Gemini can be confirmed as the working primary provider.
- Deployed API: **https://truthlens-api.truthlens-ai.workers.dev**.

## Conclusion

TruthLens AI demonstrates how a web application can combine a user-friendly interface, background processing, private cloud storage, and AI services to support media and claim review. It provides basic technical signals and clearly describes their limitations. The project is a prototype and should be treated as decision-support software: it does not replace professional forensic examination, and its AI output alone cannot establish whether media or a news claim is true.
