import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import PaginatedItems from '../../resources/js/components/paginated-items.jsx';
function Fixture() {
 const [rows,setRows]=useState(Array.from({length:45},(_,i)=>({id:i+1,status:'waiting'})));
 const [filtered,setFiltered]=useState(false);
 return <main><h1>Synthetic records only</h1>
  <button onClick={()=>setFiltered(value=>!value)}>Toggle filter</button>
  <button onClick={()=>setRows(value=>value.filter(row=>row.id<=40))}>Delete last five</button>
  <button onClick={()=>setRows(value=>value.map(row=>({...row,status:'updated'})))}>Poll status update</button>
  <section data-testid="first"><h2>First list</h2><table><tbody>
   <PaginatedItems items={filtered?rows.filter(row=>row.id>=40):rows} label="First" tableColumns={2}>
    {row=><tr key={row.id} data-record={row.id}><td>{row.id}</td><td>{row.status}</td></tr>}
   </PaginatedItems>
  </tbody></table></section>
  <section data-testid="second"><h2>Independent list</h2>
   <PaginatedItems items={rows} label="Second">{row=><div key={row.id} data-record={row.id}>{row.id}: {row.status}</div>}</PaginatedItems>
  </section>
 </main>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
