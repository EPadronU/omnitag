# Modules ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import json

from flask import Flask
from flask import jsonify
from flask import request
from flask import render_template
from flask_peewee.db import Database
from peewee import *
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# General configuration ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
DATABASE = {
    'name': 'devel.db',
    'engine': 'peewee.SqliteDatabase',
}
DEBUG = True
SECRET_KEY = 'secret'
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# Main initialization ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
app = Flask(__name__)
app.config.from_object(__name__)
db = Database(app)
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# Models ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
RESOURCE_TYPES = (('F', 'B'), ('File', 'Bookmark'))
class Resource(db.Model):
    name = CharField(max_length=50, null=False)
    type = CharField(max_length=5, null=False, choices=RESOURCE_TYPES, default='F')

    def __hash__(self):
        return hash(repr(self))

    def __repr__(self):
        return repr(self.json())

    def json(self):
        return {'id': self.id, 'name': self.name, 'type': self.type}


class Search(db.Model):
    name = CharField(max_length=50, null=False)

    def __hash__(self):
        return hash(repr(self))

    def __repr__(self):
        return repr(self.json())

    def json(self):
        return {'id': self.id, 'name': self.name}

    @classmethod
    def get_by_id(cls, search_id):
        return [row for row in cls.select().where(cls.id == search_id)]

    @classmethod
    def get_by_name(cls, name):
        return [row for row in cls.select().where(cls.name == name)]


class Tag(db.Model):
    name = CharField(max_length=20, null=False, index=True)

    def __hash__(self):
        return hash(repr(self))

    def __repr__(self):
        return repr(self.json())

    def json(self):
        return {'id': self.id, 'name': self.name}

    @classmethod
    def get_by_id(cls, ids):
        return [row for row in cls.select().where(cls.id << ids)]

    @classmethod
    def get_by_name(cls, names):
        return [row for row in cls.select().where(cls.name << names)]


class TagResource(db.Model):
    resource = ForeignKeyField(Resource)
    tag = ForeignKeyField(Tag)

    def __hash__(self):
        return hash(repr(self))

    def __repr__(self):
        return repr(self.json())

    def json(self):
        return {'id': self.id, 'resource': self.resource, 'tag': self.tag}

    @classmethod
    def get_resources_by_tags(cls, tags):
        return set(row.resource for row in cls.select().where(cls.tag << tags))


class TagSearch(db.Model):
    search = ForeignKeyField(Search)
    tag = ForeignKeyField(Tag)

    def __hash__(self):
        return hash(repr(self))

    def __repr__(self):
        return repr(self.json())

    def json(self):
        return {'id': self.id, 'search': self.search, 'tag': self.tag}

    @classmethod
    def get_tags_by_search(cls, search):
        return [row.tag for row in cls.select().where(cls.search == search)]
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# Controllers ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
@app.route('/')
def index():
    return render_template("main-view.html")

@app.route("/add-new-tag", methods=['POST'])
def add_new_tag():
    tag_name = json.loads(request.data)

    if not Tag.get_by_name([tag_name]):
        new_tag = Tag.create(name=tag_name)
        new_tag.save()
        return jsonify({"status": "success", "tag-html": render_template("tag.html", tag=new_tag)})

    return jsonify({"status": "failure"})

@app.route("/new-files")
def new_files():
    resources = [row.resource for row in TagResource.select()]
    nfiles = Resource.select().where(~(Resource.id << resources))
    return render_template("resources.html", resources=nfiles)

@app.route("/explorer", methods=['GET', 'POST'])
def explorer():
    if request.method == 'GET':
        return render_template("explorer.html", tags=Tag.select(), searches=Search.select())

    elif request.method == 'POST':
        tags_ids = json.loads(request.data)
        tags = Tag.get_by_id(tags_ids)
        resources = TagResource.get_resources_by_tags(tags)

        return render_template("resources.html", resources=resources)

@app.route("/save-search", methods=['POST'])
def save_search():
    data = json.loads(request.data)
    search_name = data["search_name"]
    tags_ids = data["tags_ids"]

    if not Search.get_by_name(search_name):
        new_search = Search.create(name=search_name)
        new_search.save()
        tags = Tag.get_by_id(tags_ids)

        for tag in tags:
            TagSearch.create(search=new_search, tag=tag).save()

        return jsonify({"status": "success", "search-html": render_template("search.html", search=new_search)})

    return jsonify({"status": "failure"})
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

if __name__ == "__main__":
    app.run()
