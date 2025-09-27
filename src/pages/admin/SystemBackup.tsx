import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Database, Download, Upload, Trash2, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SystemBackup() {
  const navigate = useNavigate();
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackupRunning, setIsBackupRunning] = useState(false);

  // Mock data - replace with real data from Supabase
  const backupHistory = [
    {
      id: "1",
      type: "Completo",
      date: "2024-01-25",
      time: "03:00",
      size: "2.3 GB",
      status: "success",
      duration: "12 min"
    },
    {
      id: "2", 
      type: "Incremental",
      date: "2024-01-24",
      time: "03:00",
      size: "154 MB", 
      status: "success",
      duration: "3 min"
    },
    {
      id: "3",
      type: "Completo",
      date: "2024-01-23",
      time: "03:00",
      size: "2.1 GB",
      status: "error",
      duration: "8 min"
    }
  ];

  const startBackup = async (type: string) => {
    setIsBackupRunning(true);
    setBackupProgress(0);

    // Simulate backup progress
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackupRunning(false);
          alert("Backup concluído com sucesso!");
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>;
    }
    if (status === 'error') {
      return <Badge className="bg-red-100 text-red-800">Erro</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Processando</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Backup do Sistema</h1>
            <p className="text-muted-foreground">Gerencie backups e restaurações dos dados do sistema</p>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Database className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">2.3 GB</div>
              <p className="text-xs text-muted-foreground">Tamanho do Banco</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">Hoje</div>
              <p className="text-xs text-muted-foreground">Último Backup</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">98.5%</div>
              <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">7 min</div>
              <p className="text-xs text-muted-foreground">Tempo Médio</p>
            </CardContent>
          </Card>
        </div>

        {/* Manual Backup */}
        <Card>
          <CardHeader>
            <CardTitle>Backup Manual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isBackupRunning ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Progresso do Backup</span>
                  <span>{backupProgress}%</span>
                </div>
                <Progress value={backupProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Processando dados... Não feche esta janela.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => startBackup("complete")}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Database className="h-6 w-6 mb-1" />
                  <span>Backup Completo</span>
                  <span className="text-xs opacity-75">Todos os dados</span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => startBackup("incremental")}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Upload className="h-6 w-6 mb-1" />
                  <span>Backup Incremental</span>
                  <span className="text-xs opacity-75">Apenas alterações</span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => startBackup("custom")}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Download className="h-6 w-6 mb-1" />
                  <span>Backup Personalizado</span>
                  <span className="text-xs opacity-75">Selecionar tabelas</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backup Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Automáticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Frequência</label>
                <Select defaultValue="daily">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">A cada hora</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Horário</label>
                <Select defaultValue="03:00">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01:00">01:00</SelectItem>
                    <SelectItem value="02:00">02:00</SelectItem>
                    <SelectItem value="03:00">03:00</SelectItem>
                    <SelectItem value="04:00">04:00</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Retenção</label>
              <Select defaultValue="30">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                  <SelectItem value="365">1 ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>Salvar Configurações</Button>
          </CardContent>
        </Card>

        {/* Backup History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Backups</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backupHistory.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="font-medium">{backup.type}</TableCell>
                    <TableCell>
                      <div>
                        <div>{new Date(backup.date).toLocaleDateString('pt-BR')}</div>
                        <div className="text-sm text-muted-foreground">{backup.time}</div>
                      </div>
                    </TableCell>
                    <TableCell>{backup.size}</TableCell>
                    <TableCell>{backup.duration}</TableCell>
                    <TableCell>{getStatusBadge(backup.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" title="Download">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Restaurar">
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Deletar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Restore Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Restaurar Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-orange-50 border border-orange-200 rounded p-4 mb-4">
              <p className="text-orange-800 text-sm">
                <strong>Atenção:</strong> A restauração substituirá todos os dados atuais. 
                Esta ação não pode ser desfeita. Certifique-se de fazer um backup antes de prosseguir.
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Carregar Arquivo de Backup
              </Button>
              <Button variant="destructive">
                <Database className="h-4 w-4 mr-2" />
                Restaurar do Último Backup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}