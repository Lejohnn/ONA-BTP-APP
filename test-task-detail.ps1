# Test API Détail Tâche - PowerShell
# Usage: .\test-task-detail.ps1 -TaskId 1

param(
    [int]$TaskId = 1
)

Write-Host "🔍 Test API Détail Tâche - ID: $TaskId" -ForegroundColor Cyan
Write-Host ""

$url = "https://btp.onaerp.com/jsonrpc/web/dataset/search_read"
$headers = @{
    "Content-Type" = "application/json"
    "btp_authentication_token" = "demo"
}

$body = @{
    jsonrpc = "2.0"
    method = "call"
    params = @{
        model = "project.task"
        method = "search_read"
        args = @()
        kwargs = @{
            domain = @(@("id", "=", $TaskId))
            fields = @(
                # Champs de base
                "id", "name", "description", "display_name",
                
                # Relations
                "project_id", "user_id", "stage_id", "partner_id",
                
                # État et progression
                "state", "priority", "progress", "kanban_state",
                
                # Dates
                "date_deadline", "date_start", "date_end", "create_date", "write_date",
                
                # Heures
                "effective_hours", "remaining_hours", "total_hours_spent", "planned_hours",
                
                # Relations complexes
                "parent_id", "child_ids", "depend_on_ids",
                
                # Sous-tâches
                "subtask_planned_hours", "subtask_effective_hours", "subtask_count",
                
                # Communication
                "email_from", "email_cc", "email_bcc",
                
                # Heures de travail
                "working_hours_open", "working_hours_close", "working_days_open", "working_days_close",
                
                # Autres
                "company_id", "color", "user_email", "create_uid", "write_uid",
                
                # Messages et activités
                "message_ids", "message_follower_ids", "message_channel_ids", "message_partner_ids",
                "activity_ids", "activity_state", "activity_type_id", "activity_date_deadline",
                "activity_summary", "activity_note", "activity_user_id",
                
                # Tags et catégories
                "tag_ids",
                
                # Timesheet
                "timesheet_ids", "timesheet_unit_amount"
            )
            limit = 1
        }
    }
} | ConvertTo-Json -Depth 10

try {
    Write-Host "📤 Envoi de la requête..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body -ContentType "application/json"
    
    Write-Host "✅ Réponse reçue!" -ForegroundColor Green
    Write-Host ""
    
    if ($response.error) {
        Write-Host "❌ Erreur API:" -ForegroundColor Red
        $response.error | ConvertTo-Json -Depth 5
        return
    }
    
    if ($response.result.records -and $response.result.records.Count -gt 0) {
        $task = $response.result.records[0]
        
        Write-Host "✅ Tâche trouvée (ID: $($task.id))" -ForegroundColor Green
        Write-Host ""
        
        # Affichage des données principales
        Write-Host "📋 INFORMATIONS DE BASE:" -ForegroundColor Cyan
        Write-Host "  ID: $($task.id)"
        Write-Host "  Nom: $($task.name)"
        Write-Host "  Description: $($task.description)"
        Write-Host "  Display Name: $($task.display_name)"
        Write-Host ""
        
        Write-Host "🔗 RELATIONS:" -ForegroundColor Cyan
        Write-Host "  Projet: $($task.project_id)"
        Write-Host "  Utilisateur: $($task.user_id)"
        Write-Host "  Étape: $($task.stage_id)"
        Write-Host "  Partenaire: $($task.partner_id)"
        Write-Host ""
        
        Write-Host "📊 ÉTAT ET PROGRESSION:" -ForegroundColor Cyan
        Write-Host "  État: $($task.state)"
        Write-Host "  Priorité: $($task.priority)"
        Write-Host "  Progression: $($task.progress)"
        Write-Host "  État Kanban: $($task.kanban_state)"
        Write-Host ""
        
        Write-Host "📅 DATES:" -ForegroundColor Cyan
        Write-Host "  Échéance: $($task.date_deadline)"
        Write-Host "  Début: $($task.date_start)"
        Write-Host "  Fin: $($task.date_end)"
        Write-Host "  Créée le: $($task.create_date)"
        Write-Host "  Modifiée le: $($task.write_date)"
        Write-Host ""
        
        Write-Host "⏰ HEURES:" -ForegroundColor Cyan
        Write-Host "  Effectives: $($task.effective_hours)"
        Write-Host "  Restantes: $($task.remaining_hours)"
        Write-Host "  Total passées: $($task.total_hours_spent)"
        Write-Host "  Planifiées: $($task.planned_hours)"
        Write-Host ""
        
        Write-Host "🔗 RELATIONS COMPLEXES:" -ForegroundColor Cyan
        Write-Host "  Tâche parent: $($task.parent_id)"
        Write-Host "  Sous-tâches: $($task.child_ids)"
        Write-Host "  Dépendances: $($task.depend_on_ids)"
        Write-Host ""
        
        Write-Host "📊 SOUS-TÂCHES:" -ForegroundColor Cyan
        Write-Host "  Nombre: $($task.subtask_count)"
        Write-Host "  Heures planifiées: $($task.subtask_planned_hours)"
        Write-Host "  Heures effectives: $($task.subtask_effective_hours)"
        Write-Host ""
        
        # Analyse de la qualité des données
        Write-Host "🔍 ANALYSE DE LA QUALITÉ DES DONNÉES:" -ForegroundColor Magenta
        Write-Host "  A un projet: $($task.project_id -ne $null)"
        Write-Host "  A un utilisateur: $($task.user_id -ne $null)"
        Write-Host "  A une étape: $($task.stage_id -ne $null)"
        Write-Host "  A une progression: $($task.progress -ne $null)"
        Write-Host "  A des heures: $($task.effective_hours -ne $null -or $task.remaining_hours -ne $null)"
        Write-Host "  A une échéance: $($task.date_deadline -ne $null)"
        Write-Host "  A des sous-tâches: $($task.subtask_count -gt 0)"
        Write-Host "  A des dépendances: $($task.depend_on_ids -and $task.depend_on_ids.Count -gt 0)"
        Write-Host ""
        
        Write-Host "📄 DONNÉES COMPLÈTES (JSON):" -ForegroundColor Cyan
        $task | ConvertTo-Json -Depth 5
        
    } else {
        Write-Host "❌ Aucune tâche trouvée avec l'ID $TaskId" -ForegroundColor Red
        Write-Host "Réponse complète:" -ForegroundColor Yellow
        $response | ConvertTo-Json -Depth 5
    }
    
} catch {
    Write-Host "❌ Erreur lors de la requête:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

