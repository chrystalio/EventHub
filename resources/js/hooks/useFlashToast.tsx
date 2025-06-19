import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';

export const useFlashToast = () => {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();

    useEffect(() => {
        console.log('Flash props:', props.flash);

        if (props.flash?.success) {
            toast.success("Success", { description: props.flash.success });
        }

        if (props.flash?.error) {
            toast.error("Error", { description: props.flash.error });
        }
    }, [props.flash]);
};
