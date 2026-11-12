-- Performance indexes for dashboard queries.
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");
CREATE INDEX "Task_projectId_updatedAt_idx" ON "Task"("projectId", "updatedAt");
CREATE INDEX "Task_status_idx" ON "Task"("status");
