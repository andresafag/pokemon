variable "name" {
  description = "Name prefix for the ECS service"
  type        = string
}

variable "cluster_id" {
  description = "ECS cluster ID (from ecs module)"
  type        = string
}

variable "task_definition_arn" {
  description = "Bootstrap task definition ARN (from ecs module); ignored after first deploy"
  type        = string
}

variable "desired_count" {
  description = "Initial number of tasks; ignored by Terraform after first apply"
  type        = number
  default     = 1
}

variable "subnet_ids" {
  description = "List of subnet IDs for the Fargate tasks (from vpc module)"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for the Fargate tasks (from vpc module)"
  type        = string
}

variable "execution_policy_attachment_id" {
  description = "Dependency token from iam module — ensures managed policy is attached first"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
