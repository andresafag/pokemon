resource "aws_ecr_repository" "this" {
  name                 = var.name
  image_tag_mutability = var.image_tag_mutability
  tags                 = var.tags
}

# No repository policy needed — the ECS execution role gets pull access
# via the AmazonECSTaskExecutionRolePolicy managed policy attached in the
# iam module. Add a resource-based policy here only if you need cross-account
# or org-scoped access in the future.


