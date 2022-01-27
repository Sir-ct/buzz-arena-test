function opennav(){
    let mnav = document.getElementById("mobilenav")
    let navbar = document.getElementById("navbar")

mnav.addEventListener("click", ()=>{
  navbar.classList.toggle("show")
  mnav.classList.toggle("show")
})
}
window.addEventListener("load", opennav)