import { Component,type ReactNode } from "react";
import { ErrorState } from "./ErrorState";
export class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return{failed:true};}
 render(){return this.state.failed?<ErrorState message="This screen could not display. Reload to continue." onRetry={()=>window.location.reload()}/>:this.props.children;}
}
