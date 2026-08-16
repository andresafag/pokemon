variable "name" {
  description = "Name prefix — also used as ECS family and container name"
  type        = string
}

variable "aws_region" {
  description = "AWS region (passed through for the awslogs log driver)"
  type        = string
}

variable "cpu" {
  description = "Fargate CPU units ('256', '512', '1024', '2048', '4096')"
  type        = string
  default     = "256"
}

variable "memory" {
  description = "Fargate memory in MB ('512', '1024', '2048', etc.)"
  type        = string
  default     = "512"
}

variable "container_port" {
  description = "Port on which the container listens"
  type        = number
  default     = 10000
}

variable "execution_role_arn" {
  description = "ARN of the ECS task execution role (from iam module)"
  type        = string
}

variable "task_role_arn" {
  description = "ARN of the ECS task role (from iam module)"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log group retention in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
