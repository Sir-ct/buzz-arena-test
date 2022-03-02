function opennav(){
  let mnav = document.getElementById("mobilenav")
  let navbar = document.getElementById("navbar")
  let welcometxt = document.getElementById("welcome-txt")
  let welcomemnu = document.getElementById("welcome-mnu")
  let category = document.getElementById("categories")
  let categorydrop = document.getElementById("catdrop")

mnav.addEventListener("click", ()=>{
navbar.classList.toggle("show")
mnav.classList.toggle("show")
})

welcometxt.addEventListener("click", ()=>{
welcomemnu.classList.toggle("show")
})

category.addEventListener("click", ()=>{
    categorydrop.classList.toggle("show")
})
}
window.addEventListener("load", opennav)