const year=new Date().getFullYear().toString()

const arr=[]
for (let i = 0; i <year.length ; i++) {
    arr.push(year.charAt(i))
}

console.log(`${arr[2]}${arr[3]}`)