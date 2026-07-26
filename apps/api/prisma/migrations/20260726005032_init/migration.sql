-- CreateEnum
CREATE TYPE "TenantKind" AS ENUM ('firm', 'individual', 'corporate', 'madfam_represented');

-- CreateEnum
CREATE TYPE "RepresentativeCredential" AS ENUM ('rcic', 'canadian_lawyer', 'canadian_paralegal', 'quebec_notary', 'spanish_abogado', 'spanish_gestor', 'other_regulated');

-- CreateEnum
CREATE TYPE "MatterPhase" AS ENUM ('intake', 'identity_validation', 'document_assembly', 'submission', 'post_arrival_tracking', 'status_transition');

-- CreateEnum
CREATE TYPE "MatterStatus" AS ENUM ('draft', 'active', 'awaiting_applicant', 'awaiting_authority', 'awaiting_representative_review', 'submitted', 'granted', 'refused', 'withdrawn', 'abandoned');

-- CreateEnum
CREATE TYPE "TaskAssignee" AS ENUM ('applicant', 'representative', 'employer', 'platform', 'authority');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('locked', 'available', 'in_progress', 'submitted', 'complete', 'waived');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('passport', 'national_id', 'birth_certificate', 'marriage_certificate', 'criminal_record', 'proof_of_income', 'proof_of_accommodation', 'health_insurance', 'degree_certificate', 'academic_transcript', 'professional_licence', 'employment_offer', 'employment_contract', 'cv', 'photograph', 'application_form', 'payment_receipt', 'biometrics_confirmation', 'prior_visa', 'travel_itinerary');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('required', 'provided', 'under_review', 'accepted', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "LegalisationRoute" AS ENUM ('none', 'apostille', 'consular', 'unknown');

-- CreateEnum
CREATE TYPE "TranslatorStandard" AS ENUM ('none', 'sworn_traductor_jurado', 'certified_translator', 'affidavit_translation', 'perito_traductor', 'translator_certification', 'unknown');

-- CreateEnum
CREATE TYPE "PresenceSource" AS ENUM ('border_stamp', 'gps', 'declared', 'itinerary', 'inferred');

-- CreateEnum
CREATE TYPE "PresenceConfidence" AS ENUM ('confirmed', 'probable', 'assumed');

-- CreateEnum
CREATE TYPE "DisclosureClass" AS ENUM ('information', 'assessment', 'advice');

-- CreateEnum
CREATE TYPE "EligibilityVerdict" AS ENUM ('eligible', 'ineligible', 'indeterminate', 'requires_human_review');

-- CreateEnum
CREATE TYPE "AuditOutcome" AS ENUM ('success', 'refused', 'failure');

-- CreateTable
CREATE TABLE "tenant" (
    "id" TEXT NOT NULL,
    "kind" "TenantKind" NOT NULL,
    "displayName" TEXT NOT NULL,
    "homeJurisdiction" CHAR(2) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "representative" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jurisdiction" CHAR(2) NOT NULL,
    "credential" "RepresentativeCredential" NOT NULL,
    "licenceNumber" TEXT NOT NULL,
    "verifiedOn" CHAR(10) NOT NULL,
    "expiresOn" CHAR(10),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "representative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reference" TEXT,
    "givenNames" TEXT,
    "familyNames" TEXT,
    "nationalities" TEXT[],
    "claimedNationality" CHAR(2),
    "dateOfBirth" CHAR(10),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matter" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "targetJurisdiction" CHAR(2) NOT NULL,
    "claimedNationality" CHAR(2) NOT NULL,
    "status" "MatterStatus" NOT NULL,
    "phase" "MatterPhase" NOT NULL,
    "openedOn" CHAR(10) NOT NULL,
    "closedOn" CHAR(10),
    "representativeId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "matter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "phase" "MatterPhase" NOT NULL,
    "title" TEXT NOT NULL,
    "assignee" "TaskAssignee" NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "dependsOn" TEXT[],
    "dueOn" CHAR(10),
    "citationIds" TEXT[],
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "issuingCountry" CHAR(2) NOT NULL,
    "issuedOn" CHAR(10),
    "expiresOn" CHAR(10),
    "status" "DocumentStatus" NOT NULL,
    "legalisationRoute" "LegalisationRoute",
    "legalisationDate" CHAR(10),
    "legalisationReference" TEXT,
    "sourceLanguage" TEXT NOT NULL,
    "translationLanguage" TEXT,
    "translatorStandard" "TranslatorStandard",
    "translationDate" CHAR(10),
    "translatorReference" TEXT,
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stay" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "country" CHAR(2) NOT NULL,
    "startOn" CHAR(10) NOT NULL,
    "endOn" CHAR(10),
    "source" "PresenceSource" NOT NULL,
    "confidence" "PresenceConfidence" NOT NULL,
    "exemptFromSchengenShortStay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pathway_evaluation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "pathwayVersion" TEXT NOT NULL,
    "asOf" CHAR(10) NOT NULL,
    "verdict" "EligibilityVerdict" NOT NULL,
    "classification" "DisclosureClass" NOT NULL,
    "released" BOOLEAN NOT NULL,
    "report" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pathway_evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "govtech_handoff" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "matterId" TEXT,
    "adapterId" TEXT NOT NULL,
    "capabilityId" TEXT,
    "title" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "classification" "DisclosureClass" NOT NULL,
    "generatedOn" CHAR(10) NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "govtech_handoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_event" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT NOT NULL,
    "actorRoles" TEXT[],
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "disclosureClass" "DisclosureClass",
    "outcome" "AuditOutcome" NOT NULL,
    "detail" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "representative_tenantId_idx" ON "representative"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "representative_tenantId_jurisdiction_licenceNumber_key" ON "representative"("tenantId", "jurisdiction", "licenceNumber");

-- CreateIndex
CREATE INDEX "applicant_tenantId_idx" ON "applicant"("tenantId");

-- CreateIndex
CREATE INDEX "applicant_tenantId_reference_idx" ON "applicant"("tenantId", "reference");

-- CreateIndex
CREATE INDEX "matter_tenantId_idx" ON "matter"("tenantId");

-- CreateIndex
CREATE INDEX "matter_tenantId_status_idx" ON "matter"("tenantId", "status");

-- CreateIndex
CREATE INDEX "matter_tenantId_applicantId_idx" ON "matter"("tenantId", "applicantId");

-- CreateIndex
CREATE INDEX "matter_representativeId_idx" ON "matter"("representativeId");

-- CreateIndex
CREATE INDEX "task_tenantId_idx" ON "task"("tenantId");

-- CreateIndex
CREATE INDEX "task_tenantId_matterId_idx" ON "task"("tenantId", "matterId");

-- CreateIndex
CREATE INDEX "task_tenantId_matterId_status_idx" ON "task"("tenantId", "matterId", "status");

-- CreateIndex
CREATE INDEX "document_tenantId_idx" ON "document"("tenantId");

-- CreateIndex
CREATE INDEX "document_tenantId_matterId_idx" ON "document"("tenantId", "matterId");

-- CreateIndex
CREATE INDEX "document_tenantId_matterId_kind_idx" ON "document"("tenantId", "matterId", "kind");

-- CreateIndex
CREATE INDEX "stay_tenantId_idx" ON "stay"("tenantId");

-- CreateIndex
CREATE INDEX "stay_tenantId_matterId_idx" ON "stay"("tenantId", "matterId");

-- CreateIndex
CREATE INDEX "stay_tenantId_matterId_startOn_idx" ON "stay"("tenantId", "matterId", "startOn");

-- CreateIndex
CREATE INDEX "pathway_evaluation_tenantId_idx" ON "pathway_evaluation"("tenantId");

-- CreateIndex
CREATE INDEX "pathway_evaluation_tenantId_matterId_idx" ON "pathway_evaluation"("tenantId", "matterId");

-- CreateIndex
CREATE INDEX "pathway_evaluation_tenantId_matterId_pathwayId_idx" ON "pathway_evaluation"("tenantId", "matterId", "pathwayId");

-- CreateIndex
CREATE INDEX "govtech_handoff_tenantId_idx" ON "govtech_handoff"("tenantId");

-- CreateIndex
CREATE INDEX "govtech_handoff_tenantId_matterId_idx" ON "govtech_handoff"("tenantId", "matterId");

-- CreateIndex
CREATE INDEX "audit_event_tenantId_idx" ON "audit_event"("tenantId");

-- CreateIndex
CREATE INDEX "audit_event_tenantId_occurredAt_idx" ON "audit_event"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "audit_event_tenantId_action_idx" ON "audit_event"("tenantId", "action");

-- CreateIndex
CREATE INDEX "audit_event_tenantId_targetType_targetId_idx" ON "audit_event"("tenantId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "representative" ADD CONSTRAINT "representative_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant" ADD CONSTRAINT "applicant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matter" ADD CONSTRAINT "matter_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matter" ADD CONSTRAINT "matter_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matter" ADD CONSTRAINT "matter_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "representative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stay" ADD CONSTRAINT "stay_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stay" ADD CONSTRAINT "stay_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pathway_evaluation" ADD CONSTRAINT "pathway_evaluation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pathway_evaluation" ADD CONSTRAINT "pathway_evaluation_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "govtech_handoff" ADD CONSTRAINT "govtech_handoff_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "govtech_handoff" ADD CONSTRAINT "govtech_handoff_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
