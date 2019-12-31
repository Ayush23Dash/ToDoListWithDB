// jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/dates.js");
const _ = require("lodash");

const app=express();

var day = date.getDate();
// var items = [];
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser: true});

const itemsSchema = (
  {
    name:String
  }
);

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name:"Welcome to your to do list."
});

const item2 = new Item({
  name:"<--Hit this to delete an item."
});

const item3 = new Item({
  name:"Hit the + button to add a new item."
});

var defaultItems = [item1,item2,item3];

const listSchema = {
  name:String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);

app.get("/",function(req,res)
{
  Item.find({},function(err,results)
  {
    if(results.length === 0)
    {
      Item.insertMany(defaultItems,function(err)
    {
      if(err)
      console.log(err);
      else
      console.log("Successfully saved default items to DB.");
    });
      res.redirect("/");
    }
    else
    {
    res.render("lists", {kindOfDay:"Today",newListItem : results});
  }
  });

});

app.get("/:customListName",function(req,res)
{

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName},function(err,results)
{
  if(!err)
    {
      if(!results){
        //Create a new List
        const list = new List({
          name:customListName,
          items:defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else{
        //Show an existing list
        res.render("lists",{kindOfDay:results.name,newListItem:results.items});
      }
    }

});


});

app.post("/",function(req,res)
{
  var itemName = req.body.newitem;
  var listName = req.body.list;

  const item4 = new Item({
    name:itemName
  });
    if(listName === "Today"){
  item4.save();
  res.redirect("/");
}else{
  List.findOne({name:listName},function(err,results)
{
  results.items.push(item4);
  results.save();
  res.redirect("/" + listName);
});
}
});



app.post("/delete",function(req,res)
{
  const checkedBoxId = req.body.checkbox;
  const listName = req.body.listName;
  // console.log(listName);
    if(listName === "Today")
    {
    Item.findByIdAndRemove(checkedBoxId,function(err){
      if(!err)
      {
      console.log("Successfully Deleted");
      res.redirect("/");
    }
    }
  );
}else{
  List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedBoxId}}},function(err,results)
{
  if(!err)
  {
    res.redirect("/" + listName);
  }
});
}



});
app.listen(process.env.PORT || 3000,function()
{
  console.log("Server is running on port 3000");
});
