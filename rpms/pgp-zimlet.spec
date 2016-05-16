Name:           pgp-zimlet
Version:        2.3.6
Release:        1%{?dist}
Summary:        Zimbra OpenPGP Zimlet

Group:          Applications/Internet
License:        GPLv2
URL:            https://github.com/Zimbra-Community/pgp-zimlet
Source0:        https://github.com/Zimbra-Community/pgp-zimlet/archive/%{version}.tar.gz

Requires:       zimbra-core >= 8.5
BuildRequires:  zip
BuildArch:      noarch

%description
Adding PGP support to Zimbra Collaboration Suite.


%prep
%setup -q


%build
cd tk_barrydegraaff_zimbra_openpgp
zip -r tk_barrydegraaff_zimbra_openpgp.zip *


%install
mkdir -p $RPM_BUILD_ROOT/opt/zimbra/zimlets-extra
cp -R tk_barrydegraaff_zimbra_openpgp/tk_barrydegraaff_zimbra_openpgp.zip $RPM_BUILD_ROOT/opt/zimbra/zimlets-extra


%post
su - zimbra -c "zmzimletctl deploy /opt/zimbra/zimlets-extra/tk_barrydegraaff_zimbra_openpgp.zip"
su - zimbra -c "zmprov fc all"
su - zimbra -c "zmmailboxdctl restart"


%preun
if [ $1 -eq 0 ] ; then
    su - zimbra -c "zmzimletctl undeploy tk_barrydegraaff_zimbra_openpgp"
    su - zimbra -c "zmprov fc all"

fi


%files
/opt/zimbra/zimlets-extra/tk_barrydegraaff_zimbra_openpgp.zip


%changelog
* Mon May 16 2016 Truong Anh Tuan <tuanta@iwayvietnam.com> - 2.3.6-1
- New release update.

* Sun May 15 2016 Truong Anh Tuan <tuanta@iwayvietnam.com> - 2.3.5-1
- New release update.

* Fri May 06 2016 Truong Anh Tuan <tuanta@iwayvietnam.com> - 2.3.3-1
- New release update.

* Fri Apr 29 2016 Truong Anh Tuan <tuanta@iwayvietnam.com> - 2.3.1-3
- Fix preun parameters NOT to undeploy the zimlet when upgrading

* Fri Apr 29 2016 Truong Anh Tuan <tuanta@iwayvietnam.com> - 2.3.1-1
- New release update.

* Wed Apr 27 2016 Truong Anh Tuan <tuanta@iwayvietnam.com> - 2.2.7-2
- Add "flushCache" after installing/uninstalling.

* Tue Apr 26 2016 Truong Anh Tuan <tuanta@iwayvietnam.com> - 2.2.7-1
- Update to release 2.2.7.

* Sun Apr 24 2016 Truong Anh Tuan <tuanta@iwayvietnam.com> - 2.2.5-1
- Initial release 2.2.5 from upstream.
