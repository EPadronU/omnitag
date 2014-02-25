#!/usr/bin/env python

# Modules ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import os
import peewee as pw
import utils

from flask import Flask
from flask import jsonify
from flask import make_response
from flask import redirect
from flask import request
from flask import render_template
from flask_peewee.db import Database
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


# General configuration ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
DATABASE = {
    'name': 'devel.db',
    'engine': 'peewee.SqliteDatabase',
}
DEBUG = True
SECRET_KEY = 'secret'
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


# Main initialization ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
app = Flask(__name__)
app.config.from_object(__name__)
db = Database(app)
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


# Models ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
class BaseModel(db.Model):
    @classmethod
    def exist(cls, **kw):
        try:
            cls.get(**kw)
        except pw.DoesNotExist:
            return False
        else:
            return True

    @classmethod
    def get_by_id(cls, ids):
        return cls.select().where(cls.id << ids)

    def __hash__(self):
        return hash(repr(self))

    def __repr__(self):
        return repr(self.json())

    def json(self):
        return {'id': self.id}


RESOURCE_TYPES = (('B', 'F'), ('Bookmark', 'File'))


class Resource(BaseModel):
    name = pw.CharField(max_length=50, null=False)
    type = pw.CharField(max_length=5, null=False, choices=RESOURCE_TYPES, default='F')

    def json(self):
        return {'id': self.id, 'name': self.name, 'type': self.type}


class Search(BaseModel):
    name = pw.CharField(max_length=50, null=False)

    @classmethod
    def get_by_name(cls, names):
        return cls.select().where(cls.name << names)

    def json(self):
        return {'id': self.id, 'name': self.name}


class Tag(BaseModel):
    name = pw.CharField(max_length=20, null=False, index=True)

    @classmethod
    def get_by_name(cls, names):
        return cls.select().where(cls.name << names)

    def json(self):
        return {'id': self.id, 'name': self.name}


class TagResource(BaseModel):
    resource = pw.ForeignKeyField(Resource)
    tag = pw.ForeignKeyField(Tag)

    @classmethod
    def get_resources_by_tag(cls, tags):
        return set(row.resource for row in cls.select().where(cls.tag << tags))

    def json(self):
        return {'id': self.id, 'resource': self.resource, 'tag': self.tag}


class TagSearch(BaseModel):
    search = pw.ForeignKeyField(Search)
    tag = pw.ForeignKeyField(Tag)

    @classmethod
    def get_tags_by_search(cls, search):
        return [row.tag for row in cls.select().where(cls.search == search)]

    def json(self):
        return {'id': self.id, 'search': self.search, 'tag': self.tag}


class User(BaseModel):
    username = pw.CharField(max_length=20)
    hashed_password = pw.CharField(max_length=80)
    firstname = pw.CharField(max_length=40, null=True)
    lastname = pw.CharField(max_length=40, null=True)
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


#~ Functions ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def get_auth_user(request):
    user_token = request.cookies.get('user-token', '|')
    user_id = user_token.split('|')[0]

    if utils.check_secure_cookie(user_token) and User.exist(id=user_id):
        return User.get(id=user_id)

    return None
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


# Controllers ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
@app.route('/')
def index():
    user = get_auth_user(request)

    if user:
        return render_template('explorer.html')

    else:
        return render_template('index.html')


@app.route('/login', methods=['POST'])
def login():
    user = None
    an_error_has_ocurred = False
    username = request.form.get('username')
    password = request.form.get('password')
    errors = {}

    if not username or not utils.validate_data(username, 'username'):
        errors['username_error'] = 'Incorrect username'
        an_error_has_ocurred = True

    elif not User.exist(username=username):
        errors['username_error'] = 'This user does not exist'
        an_error_has_ocurred = True

    else:
        user = User.get(username=username)

        if not password:
            errors['password_error'] = 'Please, introduce the password'
            an_error_has_ocurred = True

        elif not utils.check_password(password, str(user.hashed_password)):
            errors['password_error'] = 'Wrong password'
            an_error_has_ocurred = True

    if not an_error_has_ocurred:
        response = make_response(redirect('/'))
        response.set_cookie('user-token', utils.gen_secure_cookie(user.id))
        return response

    return render_template('index.html', username=username, **errors)


@app.route('/logout', methods=['GET'])
def logout():
    response = make_response(redirect('/'))
    response.set_cookie('user-token', '')
    return response


@app.route('/signup', methods=['POST'])
def signup():
    an_error_has_ocurred = False
    username = request.form.get('username')
    password = request.form.get('password')
    repeat_password = request.form.get('password-repeat')
    errors = {}

    if not username or not utils.validate_data(username, 'username'):
        errors['username_error'] = 'Use alphanumeric characters (3 to 20) only'
        an_error_has_ocurred = True

    elif User.exist(username=username):
        errors['username_error'] = 'This username is already on use'
        an_error_has_ocurred = True

    if not password or not utils.validate_data(password, 'password'):
        errors['password_error'] = 'Use alphanumeric characters (3 to 20) only'
        an_error_has_ocurred = True

    elif not repeat_password or repeat_password != password:
        errors['repeat_password_error'] = 'The passwords do not match'
        an_error_has_ocurred = True

    if not an_error_has_ocurred:
        new_user = User(username=username, hashed_password=utils.encrypt_password(password))
        new_user.save()

        response = make_response(redirect('/'))
        response.set_cookie('user-token', utils.gen_secure_cookie(new_user.id))
        return response

    return render_template('index.html', username=username, **errors)


@app.route("/search", methods=['GET'])
def get_search():
    search_id = request.args.get('search_id', None)

    if search_id is not None and search_id.isdigit() and Search.exist(id=search_id):
        return jsonify({
            'status': 'success',
            'tags_ids': [tag.id for tag in TagSearch.get_tags_by_search(search_id)]
        })
    return jsonify({'status': 'failure'})


@app.route("/search", methods=['POST'])
def new_search():
    data = request.get_json()
    search_name = data.get('search_name', '')
    tags_ids = data.get('tags_ids', '')

    if search_name and tags_ids and not Search.exist(name=search_name):
        new_search = Search.create(name=search_name)
        new_search.save()

        for tag in Tag.get_by_id(tags_ids):
            TagSearch.create(search=new_search, tag=tag).save()

        return jsonify({
            "status": "success",
            "search-html": render_template("search.html", search=new_search)
        })
    return jsonify({"status": "failure"})


@app.route("/search", methods=['PUT'])
def edit_search():
    search_id = request.get_json().get('id')
    new_name = request.get_json().get('new_name')

    if search_id is not None and search_id.isdigit() and Search.exist(id=search_id):
        Search.get(id=search_id).update(name=new_name).execute()
        return jsonify({'status': 'success'}), 200

    return jsonify({'status': 'failure'}), 404


@app.route("/search", methods=['DELETE'])
def del_search():
    search_id = request.get_json().get('id')

    if search_id is not None and search_id.isdigit() and Search.exist(id=search_id):
        Search.get(id=search_id).delete_instance(recursive=True)
        return jsonify({'status': 'success'}), 200

    return jsonify({'status': 'failure'}), 404


@app.route("/searches", methods=['GET'])
def get_searches():
    return jsonify({'result': [entry.json() for entry in Search.select()]}), 200


@app.route("/tag", methods=['POST'])
def new_tag():
    tag_name = request.get_json().get('tag_name', '')

    if tag_name and not Tag.exist(name=tag_name):
        new_tag = Tag.create(name=tag_name)
        new_tag.save()

        return jsonify({
            "status": "success",
            "tag-html": render_template("tag.html", tag=new_tag)
        })
    return jsonify({"status": "failure"})


@app.route("/tag", methods=['PUT'])
def edit_tag():
    tag_id = request.get_json().get('id')
    new_name = request.get_json().get('new_name')

    if tag_id is not None and tag_id.isdigit() and Tag.exist(id=tag_id):
        Tag.get(id=tag_id).update(name=new_name).execute()
        return jsonify({'status': 'success'}), 200

    return jsonify({'status': 'failure'}), 404


@app.route("/tag", methods=['DELETE'])
def del_tag():
    tag_id = request.get_json().get('id')

    if tag_id is not None and tag_id.isdigit() and Tag.exist(id=tag_id):
        Tag.get(id=tag_id).delete_instance(recursive=True)
        return jsonify({'status': 'success'}), 200

    return jsonify({'status': 'failure'}), 404


@app.route("/tags", methods=['GET'])
def get_tags():
    return jsonify({'result': [entry.json() for entry in Tag.select()]}), 200


@app.route("/sync", methods=['POST'])
def sync():
    for filepath in request.get_json().get('new-resources', []):
        resource_name = os.path.basename(filepath)

        if not Resource.exist(name=resource_name):
            Resource.create(name=resource_name).save()
    return '', 200


@app.route("/tag-resources", methods=['POST'])
def tag_resources():
    tags_ids = request.get_json().get('tags_ids', '')
    resources = TagResource.get_resources_by_tag(tags_ids)
    return render_template("resources.html", resources=resources)


@app.route("/untagged-resources", methods=['GET'])
def untagged_resources():
    untagged_resources = Resource.select().where(~(Resource.id << TagResource.select(TagResource.resource)))
    return render_template("resources.html", resources=untagged_resources)


@app.route("/update-resources-tags", methods=['POST'])
def update_resources_tags():
    data = request.get_json()
    action = data.get('action', '')
    resources_ids = data.get('resources_ids', '')
    tag_id = data.get('tag_id', '')

    if action and resources_ids and tag_id and Tag.exist(id=tag_id):
        resources = Resource.get_by_id(resources_ids)
        tag = Tag.get(id=tag_id)

        if action == "add":
            for resource in resources:
                if not TagResource.exist(resource=resource, tag=tag):
                    TagResource.create(resource=resource, tag=tag).save()
            return jsonify({'status': 'success'})

        elif action == "remove":
            for resource in resources:
                if TagResource.exist(resource=resource, tag=tag):
                    TagResource.get(resource=resource, tag=tag).delete_instance()
            return jsonify({'status': 'success'})
    return jsonify({'status': 'failure'})
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


# Main ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
if __name__ == "__main__":
    app.run()
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
