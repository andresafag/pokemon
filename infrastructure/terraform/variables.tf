variable "aws_region" {
  description = "AWS region where the infrastructure will be deployed"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name — used as a prefix across all resources"
  type        = string
  default     = "pokemon"
}

variable "ecr_repository_name" {
  description = "Name of the ECR repository"
  type        = string
  default     = "pokemon-app"
}

variable "desired_count" {
  description = "Initial number of Fargate tasks (CI/CD owns this value after first apply)"
  type        = number
  default     = 1
}

variable "container_port" {
  description = "Container port exposed by the application and opened in the security group"
  type        = number
  default     = 10000
}
