import { useState } from "react";

export function useToast() {

    const [toasts, setToasts] = useState([]);

    function add(message, type = "success") {

        const id = Date.now();

        setToasts(prev => [
            ...prev,
            { id, message, type }
        ]);

        setTimeout(() => {

            remove(id);

        }, 3000);

    }

    function remove(id) {

        setToasts(prev =>
            prev.filter(t => t.id !== id)
        );

    }

    return {
        toasts,
        add,
        remove
    };

}