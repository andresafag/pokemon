# ---------------------------------------------------------------------------
# Root locals
# ---------------------------------------------------------------------------
locals {
  tags = { Application = var.app_name }

  # Derive two AZs from the configured region automatically
  az_a = "${var.aws_region}a"
  az_b = "${var.aws_region}b"
}

# ---------------------------------------------------------------------------
# Module: VPC
# ---------------------------------------------------------------------------
module "vpc" {
  source = "./modules/vpc"

  name               = var.app_name
  availability_zones = [local.az_a, local.az_b]
  container_port     = var.container_port
  tags               = local.tags
}

# ---------------------------------------------------------------------------
# Module: ECR
# Provisions the container image registry.
# ---------------------------------------------------------------------------
module "ecr" {
  source = "./modules/ecr"

  name = var.ecr_repository_name
  tags = local.tags
}

# ---------------------------------------------------------------------------
# Module: IAM
# Provisions the ECS execution role (pulls images, writes logs) and the
# task role (granted to the running container for AWS API calls).
# ---------------------------------------------------------------------------
module "iam" {
  source = "./modules/iam"

  name = var.app_name
  tags = local.tags
}

# ---------------------------------------------------------------------------
# Module: ECS
# Provisions the ECS cluster, CloudWatch log group, and the bootstrap
# task definition. CI/CD registers new revisions on every push to main.
# ---------------------------------------------------------------------------
module "ecs" {
  source = "./modules/ecs"

  name               = var.app_name
  aws_region         = var.aws_region
  execution_role_arn = module.iam.execution_role_arn
  task_role_arn      = module.iam.task_role_arn
  subnet_ids         = module.vpc.public_subnet_ids
  security_group_ids = [module.vpc.ecs_security_group_id]
  container_port     = var.container_port
  cpu                = 256
  memory             = 512
  tags               = local.tags
}
