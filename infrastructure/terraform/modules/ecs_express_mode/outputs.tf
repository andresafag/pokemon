output "service_name" {
  description = "ECS service name (set as ECS_SERVICE secret in GitHub Actions)"
  value       = aws_ecs_service.this.name
}

output "service_id" {
  description = "ECS service ID"
  value       = aws_ecs_service.this.id
}
