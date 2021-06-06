//This is a TodoList app
//Created by: Siddharth Bhatnagar
//jshint esversion:6
//All the required Modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');
const date = require(__dirname + "/date.js");
const app = express();
require('dotenv').config();

//setting up body-parser and ejs
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//connecting to MongoDB server
mongoose.connect("mongodb+srv://admin-siddharth:"+process.env.MONGODB_PASSWORD+"@cluster0.ziuav.mongodb.net/todolistDB?retryWrites=true&w=majority",{ useNewUrlParser: true , useUnifiedTopology: true,  useFindAndModify: false  });

//creating Schema namely Item and List
const itemSchema= {
    name:String
};

const Item=mongoose.model("Item",itemSchema);

const listSchema={
  name: String,
  items:[itemSchema]
}

const List=mongoose.model("List",listSchema);

//Default item list 
const item1=new Item({
    name:"Welcome to your Todo List"
});

const item2=new Item({
    name:"press + to add new item in your todolist"
});

const item3=new Item({
    name:"<-- hit this to delete an item"
});

const item4=new Item({
  name:"press the - button to delete the list and 'more..' for more options"
});
const defaultItems=[item1,item2,item3,item4];
//Using date module to store current date
const day = date.getDate();

//root route get request it display the genral list with instruction on How to use
app.get("/", function(req, res) {

  //find function of mongoose to print the list of all todo List
  List.find({},function (err,found) {

    //find function to check if genral list is empyt or not
    //if empty it gets filled agaoon with all instruction
    // else it get displayed

    Item.find({}, function (err,foundItems) {
      if(foundItems.length===0){
          Item.insertMany(defaultItems,function (err) {
          if(err)
              console.log(err);
          else
            console.log("item successfully added in the DB");
          });
          res.redirect("/");
      }
      else
        res.render("list", {lists:found,Todaydate: day,listTitle: "General", newListItems: foundItems});
    });
  });
});

//post route of root it accepts new items in the current Todolist and redirects to the respective Todolist  
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName=req.body.list;
  const newitem=new Item({
    name:itemName
  });
  if(listName==="General"){
    newitem.save();
    res.redirect("/");
  }
  else{
    List.findOne({name:listName}, function(err,foundList) {
      foundList.items.push(newitem);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
});

//Post request Delete route it deletes the checked item in current Todolist and redirects to the respective Todolist 
app.post("/delete", function(req, res){
  const checkedItemId=req.body.checkbox;
  const checkedItemTitle=req.body.listTitle;

  if(checkedItemTitle==="General"){
    Item.findByIdAndRemove(checkedItemId, function (err){
      if(!err)
        console.log("removed the checked item");
      else
        console.log(err);
    });
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name:checkedItemTitle},{$pull:{items:{_id:checkedItemId}}},function (err,updatedList) {
      if(!err){
        res.redirect("/"+checkedItemTitle);
      }
    });
  }
});

//this post request is to get the title of new list and redirects to the "/:customListName" to Create new Todolist
app.post("/new/List", function (req,res) {
  res.redirect("/"+req.body.newList);
});

//this get request of the new list items created new Todolist
app.get("/:customListName",function (req,res) {
  const customListName=_.capitalize(req.params.customListName);
  List.find({},function (err,found) {
    List.findOne({name:customListName},function (err,results) {
      if(!err){
        if(results){
          res.render("list", {lists:found,Todaydate: day,listTitle: results.name, newListItems: results.items});
        }
        else{
          const list=new List({
            name:customListName,
            items:defaultItems
          });
          list.save();
          res.redirect("/"+customListName);
        }
      }
    });
  });
});

//this Post request to '/delete/list' Deletes the current Todolist and redirects you to general list
app.post("/delete/list", function (req,res) {
  const deleteListTitle=req.body.list;
  if(deleteListTitle==='General')
  {
    Item.deleteMany({},function (err) {
      if(!err)
        console.log("removed the checked List");
      else
        console.log(err);
      res.redirect('/');
    });
  }
  else{
    List.findOneAndDelete({name:deleteListTitle},function (err,result) {
      if(!err){
        console.log("removed the checked List");
        res.redirect('/');
      }
      else{
        console.log(err);
      }
    })
  }
});

//Due to this you can run this app on both local PC and a server
let port=process.env.PORT;
if(port==null||port=="")
  port=3000;

app.listen(port, function() {
  console.log("Server started on port 3000");
});
