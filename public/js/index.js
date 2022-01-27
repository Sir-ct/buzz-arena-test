function main(){


    fetch("localhost://5000").then((res) => {res.json()}).then((data)=>{
        console.log(data)
    })
}



window.addEventListener("load", main)