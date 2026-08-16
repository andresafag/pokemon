output "execution_role_arn" {
  description = "ARN of the ECS execution role"
  value       = aws_iam_role.execution.arn
}

output "execution_role_name" {
  description = "Name of the ECS execution role"
  value       = aws_iam_role.execution.name
}

output "task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.task.arn
}

output "execution_policy_attachment_id" {
  description = "Used by dependents to ensure the managed policy is attached before service creation"
  value       = aws_iam_role_policy_attachment.execution_managed.id
}
