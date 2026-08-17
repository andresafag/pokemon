variable "name" {
  description = "Name of the ECS resources."
  type        = string
}

variable "log_retention_days" {
  description = "The number of days to retain CloudWatch logs."
  type        = number
  default     = 30
}

variable "tags" {
  description = "A map of tags to apply to all resources."
  type        = map(string)
  default     = {}
}

variable "cpu" {
  description = "The CPU units for the ECS task."
  type        = number
}

variable "memory" {
  description = "The memory amount for the ECS task."
  type        = number
}

variable "execution_role_arn" {
  description = "The ARN of the task execution role."
  type        = string
}

variable "task_role_arn" {
  description = "The ARN of the task role."
  type        = string
}

variable "container_port" {
  description = "The container port to expose."
  type        = number
}

variable "aws_region" {
  description = "The AWS region for the log configuration."
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs to attach the ECS service to."
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs for the ECS service."
  type        = list(string)
}