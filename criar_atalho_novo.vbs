' Script para criar atalho do HomeManager na área de trabalho
' Este script substitui qualquer atalho anterior com configurações corretas

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Obter pasta da área de trabalho do usuário atual
strDesktop = objShell.SpecialFolders("Desktop")

' Definir caminhos
strWorkingDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
strBatchFile = strWorkingDir & "\iniciar_homemanager.bat"
strShortcut = strDesktop & "\HomeManager - Sistema de Elevadores.lnk"
strIconFile = strWorkingDir & "\static\images\home.ico"

' Verificar se o arquivo batch existe
If Not objFSO.FileExists(strBatchFile) Then
    WScript.Echo "Erro: Arquivo iniciar_homemanager.bat não encontrado em: " & strBatchFile
    WScript.Quit 1
End If

' Remover atalho antigo se existir
If objFSO.FileExists(strShortcut) Then
    objFSO.DeleteFile strShortcut, True
End If

' Criar novo atalho
Set objLink = objShell.CreateShortcut(strShortcut)
objLink.TargetPath = strBatchFile
objLink.WorkingDirectory = strWorkingDir
objLink.Description = "HomeManager - Sistema de Gerenciamento de Elevadores"
objLink.Arguments = ""

' Definir ícone se existir
If objFSO.FileExists(strIconFile) Then
    objLink.IconLocation = strIconFile & ",0"
Else
    ' Usar ícone padrão do sistema para aplicações
    objLink.IconLocation = "%SystemRoot%\System32\shell32.dll,21"
End If

' Salvar atalho
objLink.Save

' Verificar se atalho foi criado
If objFSO.FileExists(strShortcut) Then
    WScript.Echo "✅ Atalho criado com sucesso na área de trabalho!"
    WScript.Echo "📍 Local: " & strShortcut
    WScript.Echo "🎯 Aponta para: " & strBatchFile
    WScript.Echo ""
    WScript.Echo "🚀 Agora você pode usar o atalho 'HomeManager - Sistema de Elevadores' na área de trabalho"
Else
    WScript.Echo "❌ Erro ao criar atalho"
    WScript.Quit 1
End If

' Limpar objetos
Set objLink = Nothing
Set objFSO = Nothing
Set objShell = Nothing
