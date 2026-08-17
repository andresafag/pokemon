output "ecr_repository_uri" {
  description = "ECR repository URI used in CI/CD image pushes"
  value       = module.ecr.repository_uri
}

output "ecr_repository_name" {
  description = "ECR repository name"
  value       = module.ecr.repository_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_execution_role_arn" {
  description = "ECS execution role ARN"
  value       = module.iam.execution_role_arn
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN"
  value       = module.iam.task_role_arn
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}
