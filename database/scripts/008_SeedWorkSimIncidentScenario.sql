-- ============================================================================
-- HireSphere Database Migration Script
-- Script ID:   008_SeedWorkSimIncidentScenario.sql
-- Description: Seeds initial platform-wide Software Engineering Incident Response
--              WorkSim simulation scenario and published version 1.
-- Target DB:   Microsoft SQL Server 2019+
-- Execution:   Manual execution via SSMS by database administrator.
-- ============================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY

    DECLARE @ScenarioId UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111111111';
    DECLARE @VersionId UNIQUEIDENTIFIER = '22222222-2222-2222-2222-222222222222';

    -- 1. Insert SimulationScenario if not exists
    IF NOT EXISTS (SELECT 1 FROM dbo.SimulationScenarios WHERE Id = @ScenarioId)
    BEGIN
        INSERT INTO dbo.SimulationScenarios (
            Id,
            OwnerCompanyId,
            Title,
            Category,
            Description,
            EstimatedDurationMinutes,
            IsActive,
            CreatedAtUtc
        )
        VALUES (
            @ScenarioId,
            NULL, -- Platform-wide simulation
            N'Software Engineering Incident Response: Payment Gateway Latency Spike & 504 Timeouts',
            N'Software Engineering',
            N'Investigate a critical production incident in HireSphere Core Payment Service following release v2.14.0. Inspect APM telemetry, error logs, and PR git diffs to diagnose connection pool exhaustion, select an operational remediation strategy (rollback vs config override), and verify system recovery.',
            25,
            1,
            SYSDATETIMEOFFSET()
        );
        PRINT N'[INFO] Inserted SimulationScenario: ' + CAST(@ScenarioId AS NVARCHAR(36));
    END
    ELSE
    BEGIN
        PRINT N'[INFO] SimulationScenario already exists: ' + CAST(@ScenarioId AS NVARCHAR(36));
    END;

    -- 2. Insert ScenarioVersion 1 if not exists
    IF NOT EXISTS (SELECT 1 FROM dbo.ScenarioVersions WHERE Id = @VersionId)
    BEGIN
        -- Scenario Definition JSON
        DECLARE @DefinitionJson NVARCHAR(MAX) = N'{
  "ScenarioKey": "swe_incident_payment_gateway",
  "Title": "Software Engineering Incident Response: Payment Gateway Latency Spike & 504 Timeouts",
  "Category": "Software Engineering",
  "Difficulty": "Intermediate",
  "EstimatedDurationMinutes": 25,
  "InitialContext": "At 14:15 UTC, the HireSphere Core Checkout and Payment Gateway triggered P1 critical pager alerts. Customer checkout requests are timing out with HTTP 504 Gateway Timeout. Error rates have spiked from 0.02% to 18.4%, and p99 latency has jumped to 12.8 seconds. Release v2.14.0 was deployed to production 5 minutes prior to the alert at 14:10 UTC.",
  "InitialState": {
    "service_status": "Degraded (P1 Alert)",
    "error_rate_pct": "18.4%",
    "p99_latency": "12.8s",
    "active_db_connections": "20 / 20 (Maxed)",
    "connection_pool_wait_queue": "142 waiting requests",
    "investigation_step": "Initial Triage"
  },
  "EvidenceItems": [
    {
      "EvidenceKey": "telemetry_latency_alert",
      "Title": "APM Telemetry & Error Rate Monitor",
      "Category": "Telemetry",
      "InitiallyVisible": true,
      "Content": "=== HIRESPHERE APM DASHBOARD (14:00 - 14:20 UTC) ===\n[14:00 - 14:10] Baseline:\n  - Throughput: 450 req/sec\n  - p50 Latency: 48ms | p95: 110ms | p99: 185ms\n  - HTTP 200: 99.98% | HTTP 5xx: 0.02%\n  - DB Pool Utilization: 18% (18/100 connections)\n\n[14:10 UTC] EVENT: Deployment Pipeline completed Release v2.14.0 (Pod rollout: 6/6 pods ready)\n\n[14:15 UTC] ALERT: P1 Triggered:\n  - Throughput: 210 req/sec (dropping due to timeouts)\n  - p50 Latency: 4,200ms | p95: 8,900ms | p99: 12,800ms\n  - HTTP 504 Gateway Timeout: 18.4%\n  - DB Pool Utilization: 100% (20/20 per pod, 142 callers waiting in queue)"
    },
    {
      "EvidenceKey": "deployment_timeline",
      "Title": "CI/CD Deployment History & Recent Releases",
      "Category": "Deployment",
      "InitiallyVisible": true,
      "Content": "=== DEPLOYMENT AUDIT TRAIL ===\nRelease: v2.14.0\nStatus: Succeeded (14:10 UTC)\nCommit: 8f9b1c2 (branch: main)\nAuthor: Alex Vance <alex.vance@hiresphere.internal>\nPR #482: Tuning: Optimize connection pool and retry transient payment provider failures\nChanges:\n  - Modified: src/HireSphere.PaymentService/Infrastructure/DatabaseConfig.cs\n  - Modified: src/HireSphere.PaymentService/Services/PaymentProcessor.cs\nPrevious Stable Release: v2.13.9 (Deployed yesterday at 10:00 UTC, SHA 4a7c1e9)"
    },
    {
      "EvidenceKey": "error_log_excerpt",
      "Title": "Payment Service Pod Application Logs",
      "Category": "Server Logs",
      "InitiallyVisible": false,
      "Content": "=== PAYMENT-SVC POD 4 LOG EXCERPT [14:14:32 - 14:15:10 UTC] ===\n[14:14:32 ERROR] [PaymentProcessor] Timeout acquiring connection from pool.\nSystem.TimeoutException: The operation has timed out while waiting for an available connection from pool.\n  Pool Configuration: MaxPoolSize=20, ConnectionTimeout=5s.\n  Pool State: 20 active connections, 142 threads blocked waiting in pool queue.\n   at Npgsql.ConnectorPool.AllocateLong(NpgsqlConnection conn, NpgsqlTimeout timeout, Boolean async, CancellationToken cancellationToken)\n   at Npgsql.NpgsqlConnection.Open()\n   at HireSphere.PaymentService.Services.PaymentProcessor.ExecuteChargeAsync(ChargeRequest request) in /src/Services/PaymentProcessor.cs:line 84"
    },
    {
      "EvidenceKey": "git_diff_pr482",
      "Title": "Git Diff: Pull Request #482",
      "Category": "Git Diff",
      "InitiallyVisible": false,
      "Content": "=== GIT DIFF PR #482 (commit 8f9b1c2) ===\ndiff --git a/src/HireSphere.PaymentService/Infrastructure/DatabaseConfig.cs\n--- a/src/HireSphere.PaymentService/Infrastructure/DatabaseConfig.cs\n+++ b/src/HireSphere.PaymentService/Infrastructure/DatabaseConfig.cs\n@@ -14,6 +14,6 @@ public class DatabaseConfig\n-    public int MaxPoolSize { get; set; } = 100;\n-    public int ConnectionTimeoutSeconds { get; set; } = 30;\n+    // Reduced pool size to save DB server memory\n+    public int MaxPoolSize { get; set; } = 20;\n+    public int ConnectionTimeoutSeconds { get; set; } = 5;\n\ndiff --git a/src/HireSphere.PaymentService/Services/PaymentProcessor.cs\n--- a/src/HireSphere.PaymentService/Services/PaymentProcessor.cs\n+++ b/src/HireSphere.PaymentService/Services/PaymentProcessor.cs\n@@ -42,5 +42,9 @@ public async Task<PaymentResult> ExecuteChargeAsync(...)\n+    using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);\n+    for (int attempt = 1; attempt <= 5; attempt++) {\n+        var conn = await _db.GetConnectionAsync(); // blocks pool indefinitely under load\n+    }"
    },
    {
      "EvidenceKey": "payment_partner_status",
      "Title": "Third-Party Payment Gateway Status (Stripe/Adyen)",
      "Category": "External Telemetry",
      "InitiallyVisible": false,
      "Content": "=== STRIPE / ADYEN EXTERNAL STATUS MONITOR ===\nCurrent Time: 14:16 UTC\nService Status: ALL SYSTEMS OPERATIONAL\nAverage API Latency: 135ms\nAvailability: 99.995%\nNote: No incidents reported by third-party payment partner. Incoming requests from HireSphere that successfully reach the partner are processed within 140ms."
    },
    {
      "EvidenceKey": "post_remediation_telemetry",
      "Title": "Post-Remediation Verification Telemetry",
      "Category": "Telemetry",
      "InitiallyVisible": false,
      "Content": "=== VERIFICATION TELEMETRY (POST-REMEDIATION) ===\nThroughput: 465 req/sec\np50 Latency: 45ms | p95: 98ms | p99: 170ms\nHTTP 504 Gateway Timeouts: 0.00%\nHTTP 200 OK: 100.0%\nDB Connection Pool: 22 / 100 utilized (0 queued requests)\nActive Transactions: Cleanly completing under 65ms"
    }
  ],
  "Tasks": [
    {
      "TaskKey": "task_1_triage",
      "Title": "Task 1: Incident Triage & Initial Prioritization",
      "Instructions": "Customers are unable to complete checkouts. P99 latency is 12.8s and 504 Gateway Timeouts have spiked to 18.4%. Review the telemetry and deployment history. Prioritize your immediate next diagnostic step.",
      "SequenceOrder": 1,
      "UnlockedEvidenceKeys": ["telemetry_latency_alert", "deployment_timeline"],
      "AvailableActions": [
        {
          "ActionKey": "action_triage_inspect_logs_and_diff",
          "ActionType": "INSPECT",
          "Title": "Inspect Application Pod Logs & Recent Git Diff",
          "Description": "Pull the application logs from worker pods and examine the code changes introduced in Release v2.14.0 (PR #482).",
          "RequiresRationale": true,
          "TargetTaskKey": "task_2_investigate",
          "EvidenceKeysToUnlock": ["error_log_excerpt", "git_diff_pr482", "payment_partner_status"],
          "StateUpdates": {
            "investigation_step": "Root Cause Analysis",
            "evidence_gathered": "Pod Logs & Git Diff Extracted"
          },
          "FeedbackMessage": "Application logs and PR #482 git diff have been retrieved. Logs indicate database connection timeouts."
        },
        {
          "ActionKey": "action_triage_blind_restart",
          "ActionType": "EXECUTE",
          "Title": "Restart All Payment Pods Immediately",
          "Description": "Perform a rolling restart of all payment pods to flush memory without inspecting logs first.",
          "RequiresRationale": false,
          "TargetTaskKey": "task_2_investigate",
          "EvidenceKeysToUnlock": ["error_log_excerpt"],
          "StateUpdates": {
            "investigation_step": "Root Cause Analysis (Delayed by Restart)",
            "service_status": "Degraded (Restart did not fix root cause)"
          },
          "FeedbackMessage": "Pods restarted, but within 60 seconds of traffic arriving, connection pools maxed out again. Error rate remains elevated."
        },
        {
          "ActionKey": "action_triage_blame_third_party",
          "ActionType": "INSPECT",
          "Title": "Check Third-Party Payment Gateway Status Page",
          "Description": "Assume Stripe or Adyen is having an outage and inspect external status dashboards.",
          "RequiresRationale": false,
          "TargetTaskKey": "task_1_triage",
          "EvidenceKeysToUnlock": ["payment_partner_status"],
          "StateUpdates": {
            "investigation_step": "External Status Checked (Normal)"
          },
          "FeedbackMessage": "External payment gateway is completely healthy (135ms latency). The issue is internal to HireSphere."
        }
      ]
    },
    {
      "TaskKey": "task_2_investigate",
      "Title": "Task 2: Root Cause Diagnosis",
      "Instructions": "You have extracted the application error logs, PR #482 git diff, and partner telemetry. Analyze the evidence and determine the exact technical root cause of the connection timeouts.",
      "SequenceOrder": 2,
      "UnlockedEvidenceKeys": ["error_log_excerpt", "git_diff_pr482", "payment_partner_status"],
      "AvailableActions": [
        {
          "ActionKey": "action_diagnose_connection_pool_starvation",
          "ActionType": "PRIORITIZE",
          "Title": "Diagnose Connection Pool Starvation & Transaction-Holding Retries",
          "Description": "PR #482 drastically cut MaxPoolSize from 100 to 20 while adding an aggressive 5-attempt retry loop that holds active database connections inside TransactionScope, quickly exhausting all pool connections.",
          "RequiresRationale": true,
          "TargetTaskKey": "task_3_remediate",
          "StateUpdates": {
            "root_cause_identified": "Database Connection Pool Starvation (PR #482)",
            "investigation_step": "Remediation Decision"
          },
          "FeedbackMessage": "Accurate diagnosis. The reduced pool size (20) combined with retry loops holding connections caused cascading starvation."
        },
        {
          "ActionKey": "action_diagnose_cpu_exhaustion",
          "ActionType": "PRIORITIZE",
          "Title": "Diagnose High CPU & Infinite Recursion",
          "Description": "Conclude that an infinite loop or heavy serialization in the payment handler is consuming all available CPU cores.",
          "RequiresRationale": false,
          "TargetTaskKey": "task_3_remediate",
          "StateUpdates": {
            "root_cause_identified": "Incorrect (CPU Contention Hypothesized)",
            "investigation_step": "Remediation Decision"
          },
          "FeedbackMessage": "CPU utilization is only 14%. The logs specifically showed Npgsql connection pool exhaustion, not CPU saturation."
        },
        {
          "ActionKey": "action_diagnose_ddos_attack",
          "ActionType": "PRIORITIZE",
          "Title": "Diagnose Distributed Denial of Service (DDoS)",
          "Description": "Conclude that malicious botnets are flooding the checkout endpoints with volumetric traffic.",
          "RequiresRationale": false,
          "TargetTaskKey": "task_3_remediate",
          "StateUpdates": {
            "root_cause_identified": "Incorrect (DDoS Hypothesized)",
            "investigation_step": "Remediation Decision"
          },
          "FeedbackMessage": "Throughput actually dropped from 450 to 210 req/s. Traffic is legitimate customer checkout requests timing out."
        }
      ]
    },
    {
      "TaskKey": "task_3_remediate",
      "Title": "Task 3: Execute Remediation Action",
      "Instructions": "Every minute of downtime impacts customer checkouts and revenue. Select and execute the safest, fastest remediation strategy to restore service stability.",
      "SequenceOrder": 3,
      "UnlockedEvidenceKeys": [],
      "AvailableActions": [
        {
          "ActionKey": "action_remediate_rollback_release",
          "ActionType": "REMEDIATE",
          "Title": "Roll Back Release v2.14.0 to v2.13.9 Immediately",
          "Description": "Initiate an automated rollback pipeline to redeploy the known-healthy version v2.13.9 (MaxPoolSize=100, no blocking retries).",
          "RequiresRationale": true,
          "TargetTaskKey": "task_4_verify",
          "EvidenceKeysToUnlock": ["post_remediation_telemetry"],
          "StateUpdates": {
            "service_status": "Recovering (Rollback to v2.13.9 Deployed)",
            "error_rate_pct": "0.02%",
            "p99_latency": "170ms",
            "active_db_connections": "22 / 100",
            "remediation_taken": "Pipeline Rollback to v2.13.9"
          },
          "FeedbackMessage": "Rollback executed smoothly. Traffic has shifted to v2.13.9 pods. Database connection pool queue dropped to 0."
        },
        {
          "ActionKey": "action_remediate_hotfix_config_override",
          "ActionType": "REMEDIATE",
          "Title": "Apply Live ConfigMap Override to Restore MaxPoolSize=100",
          "Description": "Patch the Kubernetes ConfigMap to set MaxPoolSize=100 without a full image redeploy.",
          "RequiresRationale": true,
          "TargetTaskKey": "task_4_verify",
          "EvidenceKeysToUnlock": ["post_remediation_telemetry"],
          "StateUpdates": {
            "service_status": "Recovering (ConfigMap Override Applied)",
            "error_rate_pct": "0.05%",
            "p99_latency": "195ms",
            "active_db_connections": "45 / 100",
            "remediation_taken": "Runtime Config Override"
          },
          "FeedbackMessage": "ConfigMap patched and pods reloaded configuration. Connection limits restored, stabilizing throughput."
        },
        {
          "ActionKey": "action_remediate_disable_checkout",
          "ActionType": "REMEDIATE",
          "Title": "Disable Customer Checkout Feature Flag",
          "Description": "Turn off the checkout feature toggle entirely, displaying a Maintenance banner to all purchasing customers.",
          "RequiresRationale": false,
          "TargetTaskKey": "task_4_verify",
          "EvidenceKeysToUnlock": ["post_remediation_telemetry"],
          "StateUpdates": {
            "service_status": "Disabled (Checkout Outage for All Users)",
            "error_rate_pct": "0.00% (No checkouts permitted)",
            "remediation_taken": "Disabled Checkout"
          },
          "FeedbackMessage": "Checkout flow disabled. While timeouts stopped, customer revenue is entirely blocked. High blast radius."
        }
      ]
    },
    {
      "TaskKey": "task_4_verify",
      "Title": "Task 4: Recovery Verification & Incident Resolution",
      "Instructions": "Remediation has been deployed. Review the post-remediation verification telemetry and determine the appropriate protocol to close out the incident.",
      "SequenceOrder": 4,
      "UnlockedEvidenceKeys": ["post_remediation_telemetry"],
      "IsTerminalTask": true,
      "AvailableActions": [
        {
          "ActionKey": "action_verify_telemetry_and_schedule_postmortem",
          "ActionType": "VERIFY",
          "Title": "Verify Latency/Errors for 15 Min & Schedule Blameless Post-Mortem",
          "Description": "Confirm p99 latency returned to <200ms and error rates to 0.00% across all pods, declare the incident resolved, and schedule a blameless post-mortem with action items for load testing connection pools.",
          "RequiresRationale": true,
          "StateUpdates": {
            "service_status": "Healthy (Incident Resolved)",
            "post_mortem_scheduled": "Yes",
            "investigation_step": "Completed"
          },
          "FeedbackMessage": "Excellent operational practice. Metrics verified stable, stakeholders notified, and post-mortem scheduled."
        },
        {
          "ActionKey": "action_verify_abrupt_close",
          "ActionType": "VERIFY",
          "Title": "Close Incident Ticket Immediately Without Continued Monitoring",
          "Description": "Immediately resolve the P1 pager alert without observing telemetry trends or scheduling a retrospective.",
          "RequiresRationale": false,
          "StateUpdates": {
            "service_status": "Closed (Unmonitored)",
            "post_mortem_scheduled": "No",
            "investigation_step": "Completed"
          },
          "FeedbackMessage": "Incident closed abruptly without observing traffic stabilization or documenting lessons learned."
        }
      ]
    }
  ],
  "InitialTaskKey": "task_1_triage"
}';

        -- Scoring Rubric JSON
        DECLARE @RubricJson NVARCHAR(MAX) = N'{
  "RubricVersion": "1.0",
  "Criteria": [
    {
      "CriterionKey": "triage_prioritization",
      "Name": "Triage Prioritization & Evidence Gathering",
      "Description": "Evaluates whether the engineer prioritized log and telemetry investigation over premature actions such as blind pod restarts.",
      "MaxPoints": 25.0,
      "Rules": [
        {
          "RuleId": "triage_optimal_inspection",
          "ConditionType": "ActionTaken",
          "TargetKey": "action_triage_inspect_logs_and_diff",
          "PointsDelta": 20.0,
          "Feedback": "Systematically inspected worker pod error logs and deployment git diffs before modifying infrastructure."
        },
        {
          "RuleId": "triage_rationale_bonus",
          "ConditionType": "HasRationale",
          "TargetKey": "action_triage_inspect_logs_and_diff",
          "PointsDelta": 5.0,
          "Feedback": "Provided clear operational rationale explaining why log and diff analysis was necessary."
        },
        {
          "RuleId": "triage_blind_restart_penalty",
          "ConditionType": "ActionTaken",
          "TargetKey": "action_triage_blind_restart",
          "PointsDelta": -10.0,
          "Feedback": "Triggered premature pod restarts without gathering error evidence, causing brief customer disruption without addressing the root cause."
        }
      ]
    },
    {
      "CriterionKey": "root_cause_diagnosis",
      "Name": "Technical Diagnosis & Evidence Interpretation",
      "Description": "Evaluates the engineer''s ability to interpret application error traces and identify database connection starvation and transaction retry behavior.",
      "MaxPoints": 25.0,
      "Rules": [
        {
          "RuleId": "diagnosis_accurate_pool_starvation",
          "ConditionType": "ActionTaken",
          "TargetKey": "action_diagnose_connection_pool_starvation",
          "PointsDelta": 20.0,
          "Feedback": "Accurately diagnosed that PR #482 reduced MaxPoolSize to 20 while adding 5-retry loops holding transactions, starving the connection pool."
        },
        {
          "RuleId": "diagnosis_rationale_bonus",
          "ConditionType": "HasRationale",
          "TargetKey": "action_diagnose_connection_pool_starvation",
          "PointsDelta": 5.0,
          "Feedback": "Documented clear technical reasoning citing Npgsql pool exhaustion."
        },
        {
          "RuleId": "diagnosis_inaccurate_speculation",
          "ConditionType": "ActionTaken",
          "TargetKey": "action_diagnose_cpu_exhaustion",
          "PointsDelta": -10.0,
          "Feedback": "Misattributed connection timeouts to CPU exhaustion despite telemetry showing low CPU utilization."
        }
      ]
    },
    {
      "CriterionKey": "operational_risk_mitigation",
      "Name": "Remediation Strategy & Blast-Radius Management",
      "Description": "Evaluates the candidate''s remediation selection for rapid MTTR and minimal customer disruption.",
      "MaxPoints": 30.0,
      "Rules": [
        {
          "RuleId": "remediation_rollback_optimal",
          "ConditionType": "ActionTaken",
          "TargetKey": "action_remediate_rollback_release",
          "PointsDelta": 25.0,
          "Feedback": "Executed immediate automated rollback to the last known stable release (v2.13.9), the industry standard best practice for fast MTTR."
        },
        {
          "RuleId": "remediation_config_override_valid",
          "ConditionType": "ActionTaken",
          "TargetKey": "action_remediate_hotfix_config_override",
          "PointsDelta": 20.0,
          "Feedback": "Applied runtime configuration override to restore pool limits. Valid tactical mitigation."
        },
        {
          "RuleId": "remediation_rationale_bonus",
          "ConditionType": "HasRationale",
          "TargetKey": "action_remediate_rollback_release",
          "PointsDelta": 5.0,
          "Feedback": "Articulated justification for rollback prioritizing service availability over live debugging."
        },
        {
          "RuleId": "remediation_disable_checkout_penalty",
          "ConditionType": "ActionTaken",
          "TargetKey": "action_remediate_disable_checkout",
          "PointsDelta": -15.0,
          "Feedback": "Disabled customer checkouts entirely, creating complete revenue outage rather than rolling back the faulty deployment."
        }
      ]
    },
    {
      "CriterionKey": "verification_completeness",
      "Name": "Verification & Incident Wrap-up",
      "Description": "Evaluates whether the candidate verified system telemetry before declaring resolution and scheduled post-incident learning.",
      "MaxPoints": 20.0,
      "Rules": [
        {
          "RuleId": "verification_telemetry_postmortem",
          "ConditionType": "ActionTaken",
          "TargetKey": "action_verify_telemetry_and_schedule_postmortem",
          "PointsDelta": 15.0,
          "Feedback": "Verified p99 latency returned below SLA threshold and scheduled a blameless post-mortem."
        },
        {
          "RuleId": "verification_rationale_bonus",
          "ConditionType": "HasRationale",
          "TargetKey": "action_verify_telemetry_and_schedule_postmortem",
          "PointsDelta": 5.0,
          "Feedback": "Documented verification checklist and action items for load testing connection pools."
        },
        {
          "RuleId": "verification_abrupt_close_penalty",
          "ConditionType": "ActionTaken",
          "TargetKey": "action_verify_abrupt_close",
          "PointsDelta": -5.0,
          "Feedback": "Closed incident prematurely without monitoring post-deployment telemetry."
        }
      ]
    }
  ]
}';

        INSERT INTO dbo.ScenarioVersions (
            Id,
            SimulationScenarioId,
            VersionNumber,
            DefinitionJson,
            RubricJson,
            CreatedAtUtc
        )
        VALUES (
            @VersionId,
            @ScenarioId,
            1,
            @DefinitionJson,
            @RubricJson,
            SYSDATETIMEOFFSET()
        );
        PRINT N'[INFO] Inserted ScenarioVersion: ' + CAST(@VersionId AS NVARCHAR(36));
    END
    ELSE
    BEGIN
        PRINT N'[INFO] ScenarioVersion already exists: ' + CAST(@VersionId AS NVARCHAR(36));
    END;

    COMMIT TRANSACTION;
    PRINT N'[SUCCESS] Script 008_SeedWorkSimIncidentScenario.sql executed successfully.';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
GO
