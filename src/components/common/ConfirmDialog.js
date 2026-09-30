import Swal from 'sweetalert2';

/**
 * Enterprise confirmation dialog utility powered by SweetAlert2
 */
export const confirmDialog = async ({
  title = 'Are you sure?',
  text = 'This action cannot be undone.',
  confirmButtonText = 'Yes, Proceed',
  cancelButtonText = 'Cancel',
  icon = 'warning',
  confirmButtonColor = '#0B5C75', // primary healthcare brand color
  cancelButtonColor = '#64748B',
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    customClass: {
      popup: 'rounded-4 shadow-lg border border-slate-200',
      confirmButton: 'btn btn-primary px-3 py-1.5 rounded-2 font-semibold',
      cancelButton: 'btn btn-outline-secondary px-3 py-1.5 rounded-2',
    },
  });

  return result.isConfirmed;
};

export const showSuccessToast = (title = 'Action completed successfully') => {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
};

export const showErrorAlert = (title = 'Operation Failed', text = 'An unexpected error occurred.') => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#dc2626',
  });
};

export default confirmDialog;
