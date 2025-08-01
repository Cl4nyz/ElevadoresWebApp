Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Obter diretório do script
scriptPath = WScript.ScriptFullName
scriptDir = fso.GetParentFolderName(scriptPath)

' Mudar para o diretório do projeto
WshShell.CurrentDirectory = scriptDir

' Verificar se o ambiente virtual existe
venvPath = scriptDir & "\.venv\Scripts\pythonw.exe"
If Not fso.FileExists(venvPath) Then
    MsgBox "Ambiente virtual não encontrado!" & vbCrLf & "Execute setup.py primeiro para configurar o ambiente.", vbCritical, "HomeManager"
    WScript.Quit 1
End If

' Verificar se app.py existe
appPath = scriptDir & "\app.py"
If Not fso.FileExists(appPath) Then
    MsgBox "Arquivo app.py não encontrado!", vbCritical, "HomeManager"
    WScript.Quit 1
End If

' Executar o aplicativo sem mostrar janela usando pythonw.exe
' 0 = ocultar janela, False = não aguardar conclusão
WshShell.Run """" & venvPath & """ app.py", 0, False

' Script finaliza imediatamente
