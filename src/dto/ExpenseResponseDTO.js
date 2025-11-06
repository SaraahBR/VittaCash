export class ExpenseResponseDTO {
  constructor(despesa) {
    this.id = despesa.id;
    this.titulo = despesa.title;
    this.valor = despesa.amount;
    this.data = despesa.date;
    this.categoria = despesa.category;
    this.recorrente = despesa.recurring;
    this.tipoRecorrencia = despesa.recurrenceType;
    this.notas = despesa.notes;
    this.idUsuario = despesa.userId;
    this.criadoEm = despesa.createdAt;
    this.atualizadoEm = despesa.updatedAt;

    if (despesa.user) {
      this.usuario = {
        id: despesa.user.id,
        nome: despesa.user.name,
        email: despesa.user.email,
      };
    }
  }

  static deArray(despesas) {
    return despesas.map(despesa => new ExpenseResponseDTO(despesa));
  }
}

