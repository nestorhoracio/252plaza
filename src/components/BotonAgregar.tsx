interface Props {
  id: string;
}

export default function BotonAgregar({ id }: Props) {
  return (
    <button type="button" aria-label={`Agregar ${id} al pedido`} onClick={() => console.log('agregar', id)}>
      Agregar
    </button>
  );
}
