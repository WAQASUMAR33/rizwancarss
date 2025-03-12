
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useEffect } from "react";
export default function UserChecker(){
    const router = useRouter();
    const Authenticated = useSelector((data)=>data.isAuthenticated);
    const userrole = useSelector((data)=>data.user.role);
    useEffect(()=>{
  
      if(Authenticated){
        if(userrole==='Admin'){
          router.push('/admin-dashboard')
        }else if(userrole==='Agent'){
          router.push('/agent-dashboard/Home')
        }
        
      }else{
        router.push('/admin')
      }
    },[userrole,Authenticated])
    return(<>
    </>)
}