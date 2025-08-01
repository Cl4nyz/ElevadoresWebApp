Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Obter diretório do script
scriptPath = WScript.ScriptFullName
scriptDir = fso.GetParentFolderName(scriptPath)

' Mudar para o diretório do projeto
WshShell.CurrentDirectory = scriptDir

' Função para escrever log
Sub WriteLog(message)
    On Error Resume Next
    Dim logFile, logPath
    logPath = scriptDir & "\homemanager_launcher.log"
    Set logFile = fso.OpenTextFile(logPath, 8, True) ' 8 = ForAppending, True = Create if not exists
    logFile.WriteLine Now() & " - " & message
    logFile.Close
    On Error GoTo 0
End Sub

WriteLog "=== INICIANDO HOMEMANAGER ==="

' Verificar se o ambiente virtual existe
venvPath = scriptDir & "\.venv\Scripts\pythonw.exe"
If Not fso.FileExists(venvPath) Then
    WriteLog "ERRO: Ambiente virtual não encontrado: " & venvPath
    MsgBox "Ambiente virtual não encontrado!" & vbCrLf & vbCrLf & _
           "Localização esperada: " & venvPath & vbCrLf & vbCrLf & _
           "SOLUÇÃO:" & vbCrLf & _
           "1. Execute 'setup.py' para criar o ambiente virtual" & vbCrLf & _
           "2. Ou execute 'diagnosticar_sistema.bat' para verificar problemas", _
           vbCritical, "HomeManager - Erro de Configuração"
    WScript.Quit 1
End If

' Verificar se app.py existe
appPath = scriptDir & "\app.py"
If Not fso.FileExists(appPath) Then
    WriteLog "ERRO: app.py não encontrado: " & appPath
    MsgBox "Arquivo app.py não encontrado!" & vbCrLf & vbCrLf & _
           "Certifique-se de que todos os arquivos do HomeManager estão na pasta correta.", _
           vbCritical, "HomeManager - Arquivo Não Encontrado"
    WScript.Quit 1
End If

' Verificar se a porta 5000 já está em uso
WriteLog "Verificando se porta 5000 está disponível..."
Dim cmd, result
cmd = "netstat -an | findstr "":5000"""
result = WshShell.Run(cmd, 0, True)

If result = 0 Then
    WriteLog "Porta 5000 já está em uso - tentando abrir navegador"
    ' Porta está em uso, provavelmente o servidor já está rodando
    WshShell.Run "http://localhost:5000", 1, False
    WriteLog "Navegador aberto para servidor existente"
    WScript.Quit 0
End If

WriteLog "Porta 5000 disponível - iniciando servidor"

' Executar o aplicativo sem mostrar janela usando pythonw.exe
WriteLog "Executando: " & venvPath & " app.py"

' Usar WScript.Shell.Run com parâmetros específicos para execução silenciosa
Dim executeCmd
executeCmd = """" & venvPath & """ app.py"

' Executar em background
' 0 = janela oculta, False = não aguardar conclusão
WshShell.Run executeCmd, 0, False

WriteLog "Comando executado com sucesso"
WriteLog "Aguardando servidor inicializar..."

' Aguardar alguns segundos para o servidor iniciar
WScript.Sleep 3000

' Verificar se o servidor está respondendo
WriteLog "Testando se servidor está respondendo..."
Dim http
Set http = CreateObject("MSXML2.XMLHTTP")

On Error Resume Next
http.Open "GET", "http://localhost:5000", False
http.setRequestHeader "User-Agent", "HomeManager-Launcher"
http.Send

If Err.Number = 0 And http.Status = 200 Then
    WriteLog "Servidor OK - Status: " & http.Status
    ' Servidor está respondendo, abrir navegador
    WshShell.Run "http://localhost:5000", 1, False
    WriteLog "Navegador aberto com sucesso"
Else
    WriteLog "ERRO: Servidor não está respondendo. Status: " & http.Status & ", Erro: " & Err.Description
    MsgBox "Erro ao iniciar o HomeManager!" & vbCrLf & vbCrLf & _
           "O servidor não está respondendo na porta 5000." & vbCrLf & vbCrLf & _
           "SOLUÇÕES:" & vbCrLf & _
           "1. Execute 'diagnosticar_sistema.bat' para verificar problemas" & vbCrLf & _
           "2. Verifique se o firewall/antivírus está bloqueando" & vbCrLf & _
           "3. Execute como administrador" & vbCrLf & _
           "4. Verifique o arquivo 'homemanager_launcher.log' para mais detalhes", _
           vbCritical, "HomeManager - Erro de Conexão"
End If
On Error GoTo 0

WriteLog "=== FINALIZANDO LAUNCHER ==="

' Script finaliza
