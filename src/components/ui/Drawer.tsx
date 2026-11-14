import type { ComponentProps } from "react";
import { Modal } from "./Modal";
export function Drawer(props:ComponentProps<typeof Modal>){return <Modal {...props} className="ml-auto mr-0 min-h-dvh w-full max-w-sm rounded-none"/>;}
