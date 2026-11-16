export async function request(path,options={}) {
 const response=await fetch(`/api${path}`,{...options,headers:{'Content-Type':'application/json','X-CodeHub-Admin':'local-development',...options.headers}});
 if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.error || `Request failed (${response.status}).`);}
 return response.status===204?null:response.json();
}
export const api={resources:()=>request('/resources'),resource:id=>request(`/resources/${encodeURIComponent(id)}`),categories:()=>request('/categories'),config:()=>request('/config'),save:(data,id)=>request(`/resources${id?`/${encodeURIComponent(id)}`:''}`,{method:id?'PUT':'POST',body:JSON.stringify(data)}),remove:id=>request(`/resources/${encodeURIComponent(id)}`,{method:'DELETE'})};
