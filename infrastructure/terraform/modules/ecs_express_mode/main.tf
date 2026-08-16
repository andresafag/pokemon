# ECS Fargate Service
#
# This is the "express mode" layer: Terraform provisions the service once and
# then steps aside. The lifecycle block below tells Terraform to ignore any
# drift in task_definition or desired_count so that CI/CD deployments
# (via amazon-ecs-deploy-task-definition) never conflict with Terraform state.
resource "aws_ecs_service" "this" {
  name            = "${var.name}-service"
  cluster         = var.cluster_id
  task_definition = var.task_definition_arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = true
  }

  # CRITICAL — Terraform owns the infrastructure shape (VPC, cluster, roles).
  # CI/CD owns which task definition revision is running and how many tasks.
  # Without this block, every `terraform apply` would roll back the service
  # to the bootstrap revision and reset desired_count to the variable value.
  lifecycle {
    ignore_changes = [
      task_definition,
      desired_count,
    ]
  }

  tags = var.tags

  # Ensure the execution role policy is fully attached before the service
  # tries to pull the bootstrap image.
  depends_on = [var.execution_policy_attachment_id]
}
