Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Obter diretório do script
scriptPath = WScript.ScriptFullName
scriptDir = fso.GetParentFolderName(scriptPath)

' Obter área de trabalho do usuário
desktopPath = WshShell.SpecialFolders("Desktop")

' Criar atalho
shortcutPath = desktopPath & "\HomeManager.lnk"
Set shortcut = WshShell.CreateShortcut(shortcutPath)

' Configurar atalho
shortcut.TargetPath = scriptDir & "\HomeManager.vbs"
shortcut.WorkingDirectory = scriptDir
shortcut.Description = "Sistema de Gerenciamento de Elevadores HomeManager"
shortcut.WindowStyle = 7

' Verificar se ícone existe antes de definir
iconPath = scriptDir & "\static\images\home.ico"
If fso.FileExists(iconPath) Then
    shortcut.IconLocation = iconPath
End If

' Salvar atalho
On Error Resume Next
shortcut.Save()

If Err.Number = 0 Then
    MsgBox "Atalho criado com sucesso na área de trabalho!" & vbCrLf & "Arquivo: " & shortcutPath, vbInformation, "HomeManager"
Else
    MsgBox "Erro ao criar atalho: " & Err.Description, vbCritical, "HomeManager"
End If

On Error GoTo 0
