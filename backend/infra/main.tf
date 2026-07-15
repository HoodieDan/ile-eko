# Ilé Èkó backend — infrastructure (§13).
# Production changes go through Terraform, not ad-hoc gcloud. This is a starting
# skeleton; fill in project/region and wire state before applying.

terraform {
  required_providers {
    google = { source = "hashicorp/google", version = "~> 5.0" }
  }
}

variable "project_id" { type = string }
variable "region" { type = string, default = "us-central1" }

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs (Cloud Build, Scheduler, IAM Credentials for signBlob/OIDC).
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com", "artifactregistry.googleapis.com", "secretmanager.googleapis.com",
    "storage.googleapis.com", "cloudbuild.googleapis.com", "cloudscheduler.googleapis.com",
    "iamcredentials.googleapis.com", "cloudtasks.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

# Runtime service account.
resource "google_service_account" "api" {
  account_id   = "ile-eko-api"
  display_name = "Ilé Èkó API"
}

# Two buckets: public images + private receipts.
resource "google_storage_bucket" "public" {
  name                        = "${var.project_id}-ile-eko-public"
  location                    = var.region
  uniform_bucket_level_access = true
}
resource "google_storage_bucket" "private" {
  name                        = "${var.project_id}-ile-eko-private"
  location                    = var.region
  uniform_bucket_level_access = true
}
# Public read on the public bucket (uniform access → bucket IAM, not ACL).
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.public.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# SA can admin both buckets + sign blobs (V4 signed URLs) + read secrets.
resource "google_storage_bucket_iam_member" "obj_admin" {
  for_each = { public = google_storage_bucket.public.name, private = google_storage_bucket.private.name }
  bucket   = each.value
  role     = "roles/storage.objectAdmin"
  member   = "serviceAccount:${google_service_account.api.email}"
}
resource "google_service_account_iam_member" "token_creator" {
  service_account_id = google_service_account.api.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.api.email}"
}
resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.api.email}"
}

# Daily sweep (Cloud Scheduler → OIDC-protected /tasks/daily-sweep).
resource "google_cloud_scheduler_job" "daily_sweep" {
  name      = "ile-eko-daily-sweep"
  schedule  = "0 6 * * *"
  time_zone = "Africa/Lagos"
  http_target {
    http_method = "POST"
    uri         = "https://REPLACE_WITH_CLOUD_RUN_URL/tasks/daily-sweep"
    oidc_token { service_account_email = google_service_account.api.email }
  }
}

# NOTE: production Atlas access uses a Serverless VPC connector + Cloud NAT static
# IP (allowlist that /32); 0.0.0.0/0 is dev-only. Connector/NAT resources go here.
