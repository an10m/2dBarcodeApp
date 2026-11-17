# SignalCode

## Hackathon Context

SignalCode is a 2D barcode platform for improving trust in locally manufactured medicines. The barcode experience is the first implementation layer of a larger medicine transparency and authenticity solution.

The central idea is simple: a patient, doctor, pharmacy, or regulator should be able to scan a medicine package and see trustworthy information about its identity, manufacturer, batch, expiry, quality evidence, and verification status.

## Main Problem

> **Mahalliy dori vositalariga bo'lgan ishonchning pastligi:** korxonalar xalqaro standartlarni joriy etayotganiga qaramay, bemorlar, shifokorlar va dorixonalar ko'p hollarda import dorilarni afzal ko'rmoqda — bunga sifat haqidagi tasavvurlar, xabardorlik darajasi, marketing va brend ishonchliligi ta'sir qiladi.

### English summary

Trust in locally manufactured medicines is low. Even when manufacturers adopt international standards, patients, doctors, and pharmacies often prefer imported medicines because of perceived quality, limited awareness, marketing, and brand trust.

This is not only a barcode problem. It is a transparency, communication, verification, and sector-adoption problem.

## Main Solution

> **Mahalliy dorilarga ishonchni oshirish platformasi:** sifat sertifikatlari va laboratoriya natijalarini shaffof ko'rsatuvchi, dori haqiqiyligini tekshirish imkonini beruvchi hamda bemorlar, tibbiyot xodimlari va dorixonalarni mahalliy mahsulotni tanlashga rag'batlantiruvchi raqamli yechim yaratish.

### English summary

Create a digital platform that increases trust in local medicines by transparently showing quality certificates and laboratory results, enabling medicine authenticity checks, and encouraging patients, healthcare workers, and pharmacies to choose local products.

## Why Start With 2D Barcodes?

A 2D barcode is the bridge between a physical medicine package and a trusted digital record. It can connect a package to:

- Product name, composition, and dosage information
- Manufacturer and production facility
- Batch or lot number
- Production and expiry dates
- GS1 identifiers and product serial number
- Quality certificates and laboratory reports
- Recall, warning, or verification status
- Patient-facing education and usage information

The barcode does not prove quality by itself. It allows a scan to check whether the package matches authoritative records. Quality claims must come from trusted manufacturers, laboratories, regulators, or other verifiable issuers.

## Current Prototype

The current prototype is a responsive operations dashboard called **SignalCode**. It demonstrates the product direction and core information architecture:

- Barcode library with product identity records
- GS1 DataMatrix, QR/Digital Link, and Data Matrix formats
- Search and status filtering
- Barcode creation modal
- Scan and import entry points
- Scan activity stream
- Workspace metrics
- Organization-oriented navigation
- Responsive desktop and mobile layout

Current limitations:

- Barcode records are seeded demo data held in client state.
- Scan and import actions currently show prototype notifications.
- Camera decoding is not connected yet.
- No real GS1 validation service is connected yet.
- No production database, authentication, certificates, laboratory integrations, or regulatory verification exists yet.
- The current product names are generic demo examples and do not represent real medicines.

The prototype should be presented honestly as a product direction and workflow demonstration, not as a live medicine verification service.

## Target Users and Journeys

### Manufacturer

1. Register a medicine and its GTIN, batch, serial, expiry, and manufacturer data.
2. Upload certificates and laboratory reports.
3. Generate or connect a GS1 2D barcode.
4. Publish a verifiable product record.
5. Monitor scans, warnings, and recall communication.

### Pharmacy

1. Scan a medicine before stocking or selling it.
2. Confirm product, batch, expiry, and authenticity status.
3. See relevant quality evidence and warnings.
4. Report suspicious or damaged packaging.

### Doctor

1. Scan or search a medicine.
2. Review manufacturer, quality evidence, and product information.
3. Recommend a locally manufactured alternative with greater confidence.

### Patient

1. Scan the package using a phone camera.
2. See whether the product is known, valid, expired, recalled, or suspicious.
3. Review accessible quality and laboratory information.
4. Receive guidance about what to do when verification fails.

### Regulator and Platform Administrator

1. Review registered manufacturers, products, batches, and reports.
2. Monitor suspicious scan patterns and counterfeit signals.
3. Publish warnings, recalls, and verification decisions.
4. Audit changes to certificates and quality records.

## MVP Scope

The smallest useful hackathon scope should include:

1. A manufacturer/product/batch data model.
2. GS1-oriented 2D barcode generation and parsing.
3. A public scan result with clear status states.
4. A trusted record view containing manufacturer, batch, expiry, and evidence links.
5. A basic manufacturer dashboard.
6. A basic pharmacy/patient verification flow.
7. A platform-admin view for products, scan events, and suspicious activity.
8. A clear demo dataset with valid, expired, recalled, and unknown examples.

Do not claim full pharmaceutical compliance during the hackathon. Present the prototype as a foundation that must be validated with regulators, manufacturers, laboratories, pharmacies, and legal experts.

## Planned Architecture

Recommended implementation stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres, Auth, and Storage
- Vercel deployment
- Browser barcode decoding library after a GS1 compatibility spike

Planned core entities:

- `users`
- `organizations`
- `organization_members`
- `manufacturers`
- `medicines`
- `batches`
- `barcode_records`
- `certificates`
- `laboratory_reports`
- `scan_events`
- `recalls`
- `verification_reports`
- `audit_events`

Every organization-owned record needs an explicit organization boundary. Platform-admin access must be enforced server-side and never only by hiding a client-side navigation item.

## Trust and Safety Principles

- A barcode identifies a record; it does not independently establish product quality.
- Evidence must show its issuer, publication date, scope, and current status.
- Certificates and laboratory results need an audit trail and controlled permissions.
- Verification responses must distinguish `verified`, `expired`, `recalled`, `unknown`, `duplicate`, and `suspicious` states.
- Do not expose private patient information in scan events.
- A failed scan should provide a safe next action rather than a vague error.
- Legal and regulatory responsibility must remain with the appropriate manufacturer, laboratory, regulator, or healthcare authority.
- Uzbek, Russian, and English language support should be planned from the data model stage.

## Hackathon Scoring Alignment

The domain mentor is the primary lens for this project. Technical and business quality matter, but the strongest submission will show that the solution understands the pharmaceutical sector and can improve real trust without making unsupported claims.

### Technical Mentor

| Criterion | How SignalCode should demonstrate it |
| --- | --- |
| **T1: Texnik amalga oshirilish** | Show a working scan-to-verification flow, clear status logic, organization boundaries, and a maintainable architecture. |
| **T2: Kod tayyorligi** | Demonstrate a runnable prototype, focused tests for parsing and verification states, clear setup instructions, and honest separation of demo data from production integrations. |
| **T3: Yechimning innovatsionligi** | Combine 2D identity, transparent quality evidence, scan-based trust, and sector workflows instead of presenting only a barcode generator. |
| **T4: Jamoa bilim darajasi** | Explain GS1, the difference between authenticity and quality, data provenance, user roles, and the legal limits of the platform. |
| **T5: Texnologiyalar to'plami** | Use appropriate web, database, scanning, security, and audit technologies without adding infrastructure that the team cannot explain. |

### Business Mentor

| Criterion | How SignalCode should demonstrate it |
| --- | --- |
| **B1: G'oya va muammoning dolzarbligi** | Address a visible trust problem affecting local manufacturers, patients, doctors, and pharmacies. |
| **B2: Biznes modeli / monetizatsiya** | Consider manufacturer subscriptions, verification infrastructure for producers, pharmacy tools, analytics, and institution partnerships while keeping public verification accessible. |
| **B3: Raqobatdagi ustunlik** | Focus on transparent evidence and local-sector workflows, not only serialization or generic QR generation. |
| **B4: Moliyaviy barqarorlik** | Start with a focused B2B or institution-supported model and control the cost of storage, scanning, evidence hosting, and support. |
| **B5: O'sish imkoniyati** | Expand from local manufacturers to pharmacies, laboratories, regulators, recalls, regional markets, and multilingual public verification. |

### Domain Mentor: Primary Focus

| Criterion | How SignalCode should demonstrate it |
| --- | --- |
| **S1: Muammoning dolzarbligi** | Show how low trust, counterfeit risk, limited information, and imported-product preference affect the medicine ecosystem. |
| **S2: Sohani tushunish chuqurligi** | Explain manufacturing batches, GTIN/serial identifiers, certificates, laboratory reports, expiry, recalls, pharmacy workflows, and regulatory responsibility. |
| **S3: Amaliy qo'llanilishi** | Demonstrate a realistic patient, pharmacy, manufacturer, and regulator flow with useful outcomes after every scan. |
| **S4: Qonunchilikka muvofiqlik** | Avoid unsupported medical claims, protect personal data, preserve evidence provenance, define authority over verification records, and validate requirements with legal/regulatory experts. |
| **S5: Ta'sir ko'lami** | Measure verified products, participating manufacturers, pharmacy usage, suspicious packages reported, and improved confidence in local products. |

## Demo Narrative

A strong five-minute demo should follow one medicine through the ecosystem:

1. A local manufacturer creates a product and batch record.
2. The manufacturer attaches a certificate and laboratory result.
3. SignalCode generates or registers the GS1 2D identity.
4. A pharmacy scans the package and sees a verified result.
5. A patient scans the same package and receives a simpler explanation.
6. A second scan shows an expired, recalled, duplicated, or unknown example.
7. The admin view shows the event, evidence source, and recommended action.
8. The team explains how this foundation can scale into a national trust layer.

## Evidence Checklist for the Presentation

- One valid local-medicine demo record
- One invalid or unknown barcode example
- One expired or recalled batch example
- Certificate and laboratory evidence shown with issuer and date
- A visible distinction between authenticity and quality
- A clear explanation of what is simulated
- A clear explanation of who is legally responsible for each data source
- A measurable impact hypothesis
- A roadmap beyond barcode generation

## Growth Roadmap

### Hackathon

- Dashboard and product identity workflow
- Demo barcode generation
- Basic scan result states
- Seeded quality evidence
- Manufacturer and admin views

### Next release

- Real camera and image scanning
- GS1 payload validation and Digital Link support
- Supabase authentication and organization roles
- Certificates and laboratory report uploads
- Batch import and duplicate detection
- Audit events and recall states

### Production foundation

- Signed verification records
- Issuer verification for manufacturers and laboratories
- Regulatory integration and controlled publication workflows
- Offline-friendly pharmacy and patient scanning
- Uzbek, Russian, and English interfaces
- Privacy controls and retention policies
- Analytics for counterfeiting signals and recalls

### Ecosystem scale

- Pharmacy integrations
- Manufacturer quality portals
- Laboratory systems
- Regulator dashboards
- Public education and trust metrics
- Regional expansion and standards interoperability

## Prompts for Future AI Agents

Use these prompts as the next implementation tasks. Each task should preserve the medicine-trust mission and avoid treating the project as a generic barcode CRUD app.

### Product and domain

> Design a medicine verification data model that distinguishes product identity, batch identity, serial identity, authenticity status, quality evidence, laboratory reports, recalls, and source authority. State which fields are public and which are restricted.

### GS1 and scanning

> Implement a GS1-oriented payload parser and validator for the supported application identifiers. Add tests for valid, malformed, expired, duplicate, and unsupported payloads. Do not claim that successful decoding proves medicine quality.

### Verification flow

> Build a scan-result screen with clear `verified`, `expired`, `recalled`, `unknown`, `duplicate`, and `suspicious` states. Each state must show the evidence source, confidence limitations, and a safe next action for the user.

### Quality evidence

> Add certificate and laboratory report records with issuer, issue date, expiry date, scope, verification status, document reference, and audit history. Ensure the UI explains what each document does and does not prove.

### Security and tenancy

> Add organization-level access controls for manufacturers, pharmacies, laboratories, and platform admins. Test that users cannot access another organization’s medicine, batch, certificate, or scan records.

### Domain validation

> Review the proposed workflow against pharmaceutical-sector and data-protection requirements. List assumptions that require confirmation from a qualified local regulatory or legal expert.

### Impact measurement

> Define dashboard metrics for verified local products, pharmacy adoption, scan completion, suspicious packages, recall reach, evidence freshness, and user confidence. Avoid presenting unmeasured trust improvement as a fact.

## Expected Questions and Answers

**Is this a QR-code generator?**  
No. 2D barcodes are the first interface. The larger solution is a trusted medicine identity, evidence, and verification platform.

**Does scanning prove that a medicine is safe?**  
No. Scanning checks a package against trusted records. Safety and quality evidence must come from responsible manufacturers, laboratories, healthcare authorities, and regulators.

**How is this different from a normal product database?**  
It connects serialized physical packaging to batch-level evidence, scan events, recalls, and role-specific workflows for the medicine ecosystem.

**What happens when a barcode is unknown?**  
The user sees an explicit unknown or suspicious state with guidance not to rely on the result and to contact the appropriate pharmacy, manufacturer, or authority.

**Can a copied barcode be detected?**  
Repeated scans, impossible locations, duplicate serial activity, and inconsistent batch behavior can create signals, but detection requires real deployment data and must be presented as a risk signal rather than automatic proof of fraud.

**Who owns the data?**  
The platform needs explicit agreements with manufacturers, laboratories, pharmacies, and regulators. Access must follow organization roles, data minimization, and applicable privacy rules.

**What is the business model?**  
Possible models include manufacturer subscriptions, verification infrastructure services, pharmacy tools, institution partnerships, and analytics. Public safety verification should not be hidden behind a paywall without careful policy review.

**Why would local manufacturers participate?**  
The platform can make their quality evidence visible, reduce counterfeit confusion, strengthen pharmacy relationships, and create measurable trust signals.

**What requires expert validation?**  
GS1 implementation, medicine serialization rules, certificate authority, laboratory evidence, privacy, medical communication, recall responsibility, and local regulatory compliance all require qualified domain review.

## AI Agent Handoff

### Repository and stack

The application lives in `2dBarcodeApp/` and is a Next.js App Router TypeScript project with Tailwind CSS configuration.

Important files:

- `2dBarcodeApp/src/app/page.tsx` - current dashboard UI, seeded barcode records, create flow, search, filters, and prototype actions
- `2dBarcodeApp/src/app/globals.css` - visual system, responsive layout, dashboard components, modal, badges, and states
- `2dBarcodeApp/src/app/layout.tsx` - metadata and root layout
- `2dBarcodeApp/package.json` - scripts and dependencies
- `2dBarcodeApp/tsconfig.json` - TypeScript configuration
- `2dBarcodeApp/eslint.config.mjs` - ESLint configuration

### Current conventions

- Keep the interface operational and information-dense rather than marketing-oriented.
- Use green, off-white, and lime accents to preserve the current SignalCode identity.
- Keep cards compact and useful for repeated workflows.
- Prefer explicit status labels and evidence over vague trust language.
- Make mobile scan and verification workflows first-class.
- Keep domain logic separate from UI as real barcode, auth, and database behavior is added.
- Use ASCII in source files unless Uzbek or other language content requires otherwise.

### Recommended next tasks

1. Install Node.js and verify `npm run typecheck`, `npm run lint`, and `npm run build`.
2. Replace client-only demo records with a typed domain model.
3. Add a GS1 parser/validator and canonical test payloads.
4. Add a public verification route that accepts a decoded barcode value.
5. Add valid, expired, recalled, duplicate, and unknown demo states.
6. Add Supabase schema, authentication, organization membership, and row-level security.
7. Add certificate and laboratory evidence records.
8. Connect camera/image scanning only after the decoder is tested against the chosen GS1 formats.
9. Add Uzbek/Russian/English content structure.
10. Validate the product flow with a pharmacist, manufacturer, doctor, or regulatory expert.

### Local commands

```powershell
cd "2dBarcodeApp"
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

## Public Scanner and Admin Platform

SignalCode has two distinct audiences:

### Public users: scan only

The public scanner is available at `/scan`. Patients, doctors, and pharmacy staff should not need an account or access to product-management tools just to verify a package. This flow is designed to become the simple mobile-first entry point for:

- Camera or image-based barcode scanning
- Manual GTIN, serial, or payload entry
- Product, batch, expiry, and verification status
- Public quality-evidence summary
- Safe guidance for expired, recalled, unknown, or suspicious results

The current `/scan` page includes manual/demo verification and a camera entry point reserved for the real GS1 decoder integration.

### Authenticated users: manage and administer

The main dashboard is for manufacturers, workspace members, and administrators. Its menu now switches between real views:

- **Overview** - metrics, recent activity, and quick actions
- **Barcode library** - search, filter, and review product identities
- **Scan activity** - verification events and suspicious activity signals
- **Imports** - batch import queue and review states

The dashboard's **Scan** action links to the public `/scan` experience instead of pretending that the admin dashboard is the only user flow.

## Cloudflare Free Deployment

The project is configured for Cloudflare Workers using the OpenNext adapter. It does not use `output: "export"`, because the future verification API and authentication need server-side Worker support.

### Cloudflare services

| Need | Cloudflare service | MVP usage |
| --- | --- | --- |
| Web application | Workers | Host the Next.js application through OpenNext. |
| Structured data | D1 | Future medicine, batch, barcode, scan, and audit records. |
| Certificates and reports | R2 | Future lab reports, certificates, and evidence documents. |
| Abuse protection | Turnstile | Future public verification and report-suspicious forms. |
| Short-lived counters | KV | Optional future rate limits and cached public status responses. |

The current prototype is client-side demo data, so it does not require D1, R2, KV, or Turnstile bindings yet. Add those bindings only when the corresponding backend slice is implemented.

### Required files

- `wrangler.jsonc` - Worker entry point, static assets, compatibility flags, and self-reference service.
- `open-next.config.ts` - OpenNext Cloudflare adapter configuration.
- `.gitignore` - Excludes `.open-next` and Wrangler output.
- `public/_headers` - Adds immutable caching for generated static assets.

### Deploy commands

Install Node.js 20 or newer, then run:

```powershell
cd "2dBarcodeApp"
npm install
npm run dev
npm run preview
npm run deploy
```

Authenticate Wrangler with `npx wrangler login` before the first deployment. The free deployment will use a `workers.dev` URL unless a custom domain is configured.

### Git deployment settings

When connecting the repository to Cloudflare's Git deployment flow, use:

```text
Root directory: blank when package.json is at the repository root
Build command: npm run build
Deploy command: npm run deploy
Production branch: main
```

Do not use `npx wrangler deploy` as the deploy command by itself. The `npm run deploy` script first runs `opennextjs-cloudflare build`, which creates `.open-next/worker.js`, and then deploys that generated Worker. A direct Wrangler deploy after only `next build` produces the `Could not find compiled Open Next config` error.

For a real medicine platform, create D1/R2/Turnstile resources in the Cloudflare dashboard or Wrangler and add their bindings to `wrangler.jsonc`. Do not put database credentials or private certificate storage keys in client-side environment variables.

### Cloudflare next steps

1. Add D1 migrations for medicines, batches, barcode records, verification statuses, and audit events.
2. Add Worker-compatible server routes for public verification and suspicious-package reports.
3. Add R2 storage for certificates and laboratory evidence with signed access URLs.
4. Add Turnstile to public forms and rate-limit verification requests.
5. Add authentication and organization roles without exposing private manufacturer records to the public scanner.

## Disclaimer

SignalCode is a hackathon prototype and does not currently certify, approve, or guarantee the quality, safety, or authenticity of any medicine. Any production version must be designed with pharmaceutical manufacturers, laboratories, pharmacies, healthcare professionals, regulators, security specialists, and legal experts.
