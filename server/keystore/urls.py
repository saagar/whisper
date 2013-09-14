from django.conf.urls import patterns, include, url

from .views import create_user, get_key, login_user, get_friends, \
                   get_public_key, add_friend, current_user, email_verify

urlpatterns = patterns('',
    url(r'^user/$', current_user),
    url(r'^user/create/$', create_user),
    url(r'^user/login/$', login_user),
    url(r'^user/friends/$', get_friends),
    url(r'^user/friends/add/$', add_friend),
    url(r'^user/get/(?P<username>.*)/$', get_key),
    url(r'^key/$', get_public_key),
    url(r'^user/verify/(?P<code>.*)/$', email_verify, name='verify'),

)
