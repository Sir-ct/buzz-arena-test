function main(){
    let atitle = document.getElementById("n-a-t")
    let adescription = document.getElementById("n-a-d")
    let aarticle = document.getElementById("n-a-c")
    let submit = document.getElementById("publish-btn")

    submit.addEventListener("click", ()=>{ 

        submitdata("/newArticle", {
            title: atitle.value,
            description: adescription.value,
            article: aarticle.value
        })
    })

    function submitdata(path, data){
        fetch(path, {
            method: "post",
            headers: new Headers({"Content-Type": "application/json"}),
            body: JSON.stringify(data)
        }).then(res => res.json()).then((response)=>{
            console.log(response._id)
        })
    }
    
}




window.addEventListener("load", main) 