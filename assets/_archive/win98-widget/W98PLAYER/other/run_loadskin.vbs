Option Explicit
Dim MyBatchFile
Dim WshShell, strCurDir
Set WshShell = CreateObject("WScript.Shell")
strCurDir    = WshShell.CurrentDirectory
MyBatchFile = strCurDir + "\loadskin.bat"
Call Run(MyBatchFile,0,False) 'Hidding the console
'*********************************************************************************
Function Run(MyBatchFile,Console,bWaitOnReturn)
    Dim ws,Result
    Set ws = CreateObject("wscript.Shell")
'A value of 0 to hide the MS-DOS console
    If Console = 0 Then
        Result = ws.run(DblQuote(MyBatchFile),Console,bWaitOnReturn)
        If Result = 0 Then
            'MsgBox "Success"
        Else
            MsgBox "An unknown error has occurred!",16,"An unknown error has occurred!"
        End If
    End If
'A value of 1 to show the MS-DOS console
    If Console = 1 Then
        Result = ws.run(DblQuote(MyBatchFile),Console,bWaitOnReturn)
        If Result = 0 Then
            'MsgBox "Success"
        Else
            MsgBox "An unknown error has occurred!",16,"An unknown error has occurred!"
        End If
    End If
    Run = Result
End Function
'*********************************************************************************
Function DblQuote(Str)
    DblQuote = Chr(34) & Str & Chr(34)
End Function
'*********************************************************************************