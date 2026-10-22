import './App.css'

function App() {
  
  return (
    <>
      <div className="">
          <div className="text-white h-18 bg-gray-500 mt-10 ml-10 mr-10 mb-10 rounded-full">
            <h1 className='flex justify-center font-bold text-2xl px-10'>Telemetry Moniter</h1>
            <p className='flex justify-center'>YANG-Push Pipeline - Network Observability</p>
          </div>
          <div className="text-white h-80 bg-gray-500 mt-10 ml-10 mr-10 rounded-xl">
              <div className='grid grid-cols-2 gap-10 px-10 py-10'>
                  <div className=" bg-red-500 rounded-full py-10 px-10">
                      <h1>Hello</h1>
                  </div>
                  <div className=" bg-red-500 rounded-full py-10">

                  </div>
                  <div className=" bg-red-500 rounded-full py-10">

                  </div>
                  <div className=" bg-red-500 rounded-full py-10">

                  </div>
                 
              </div>
          </div>
      </div>



    </>
  )
}

export default App
